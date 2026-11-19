/**
 * Pure, dependency-free anchor matching utilities.
 *
 * This module deliberately has no Figma runtime dependency so it can be unit
 * tested in Node and concatenated into the production plugin bundle.
 */
const CommentRelayMatcher = (() => {
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

  function normalize(value) {
    return String(value || "")
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function tokenSimilarity(left, right) {
    const a = new Set(normalize(left).split(" ").filter(Boolean));
    const b = new Set(normalize(right).split(" ").filter(Boolean));
    if (!a.size && !b.size) return 1;
    if (!a.size || !b.size) return 0;
    let intersection = 0;
    for (const token of a) if (b.has(token)) intersection += 1;
    return intersection / (a.size + b.size - intersection);
  }

  function pathSimilarity(sourcePath = [], targetPath = []) {
    if (!sourcePath.length || !targetPath.length) return 0;
    const source = sourcePath.map((part) => `${normalize(part.type)}:${normalize(part.name)}`);
    const target = targetPath.map((part) => `${normalize(part.type)}:${normalize(part.name)}`);
    const maxLength = Math.max(source.length, target.length);
    let suffixMatches = 0;
    for (let index = 1; index <= Math.min(source.length, target.length); index += 1) {
      if (source[source.length - index] !== target[target.length - index]) break;
      suffixMatches += 1;
    }

    const sourceNames = new Set(source);
    let overlap = 0;
    for (const part of target) if (sourceNames.has(part)) overlap += 1;
    const overlapScore = overlap / Math.max(sourceNames.size, new Set(target).size, 1);
    return clamp((suffixMatches / maxLength) * 0.72 + overlapScore * 0.28);
  }

  function dimensionSimilarity(source, target) {
    if (!source || !target || !source.width || !source.height || !target.width || !target.height) return 0;
    const widthRatio = Math.min(source.width, target.width) / Math.max(source.width, target.width);
    const heightRatio = Math.min(source.height, target.height) / Math.max(source.height, target.height);
    return clamp((widthRatio + heightRatio) / 2);
  }

  function scoreCandidate(source, target) {
    if (!source || !target) return { score: 0, reasons: [] };
    if (source.stableId && target.stableId && source.stableId === target.stableId) {
      return { score: 1, reasons: ["stable anchor"] };
    }
    if (source.nodeId && target.nodeId && source.nodeId === target.nodeId) {
      return { score: 0.995, reasons: ["same node id"] };
    }

    let score = 0;
    const reasons = [];
    if (source.type === target.type) {
      score += 0.13;
      reasons.push("same layer type");
    }

    const nameScore = tokenSimilarity(source.name, target.name);
    score += nameScore * 0.2;
    if (nameScore >= 0.99) reasons.push("same layer name");

    const pageScore = normalize(source.pageName) === normalize(target.pageName) ? 1 : tokenSimilarity(source.pageName, target.pageName);
    score += pageScore * 0.12;
    if (pageScore >= 0.99) reasons.push("same page");

    const hierarchyScore = pathSimilarity(source.path, target.path);
    score += hierarchyScore * 0.35;
    if (hierarchyScore >= 0.75) reasons.push("matching hierarchy");

    const sizeScore = dimensionSimilarity(source.bounds, target.bounds);
    score += sizeScore * 0.12;
    if (sizeScore >= 0.9) reasons.push("matching size");

    const textScore = source.text && target.text ? tokenSimilarity(source.text, target.text) : 0;
    score += textScore * 0.08;
    if (textScore >= 0.9) reasons.push("matching text");

    return { score: clamp(score), reasons };
  }

  function confidenceLabel(score) {
    if (score >= 0.9) return "high";
    if (score >= 0.72) return "review";
    return "manual";
  }

  function findBestMatch(source, candidates) {
    if (!source || !Array.isArray(candidates) || !candidates.length) {
      return { target: null, score: 0, confidence: "manual", reasons: [] };
    }

    if (source.stableId) {
      const stableTarget = candidates.find((candidate) => candidate.stableId === source.stableId);
      if (stableTarget) {
        return { target: stableTarget, score: 1, rawScore: 1, margin: 1, confidence: "high", reasons: ["stable anchor"] };
      }
    }
    if (source.nodeId) {
      const sameIdTarget = candidates.find((candidate) => candidate.nodeId === source.nodeId);
      if (sameIdTarget) {
        return { target: sameIdTarget, score: 0.995, rawScore: 0.995, margin: 0.995, confidence: "high", reasons: ["same node id"] };
      }
    }

    let best = null;
    let secondBest = null;
    for (const candidate of candidates) {
      const result = scoreCandidate(source, candidate);
      const item = { target: candidate, score: result.score, reasons: result.reasons };
      if (!best || item.score > best.score) {
        secondBest = best;
        best = item;
      } else if (!secondBest || item.score > secondBest.score) {
        secondBest = item;
      }
    }

    const margin = secondBest ? best.score - secondBest.score : best.score;
    let adjustedScore = best.score;
    if (best.score < 0.995 && margin < 0.035) adjustedScore = Math.max(0, best.score - 0.12);
    if (best.score < 0.995 && margin < 0.015) adjustedScore = Math.max(0, best.score - 0.12);

    return {
      target: best.target,
      score: adjustedScore,
      rawScore: best.score,
      margin,
      confidence: confidenceLabel(adjustedScore),
      reasons: best.reasons,
    };
  }

  function mapClientMeta(clientMeta, sourceAnchor, targetAnchor) {
    if (!clientMeta) return null;
    const mapped = JSON.parse(JSON.stringify(clientMeta));
    if (!mapped.node_id || !targetAnchor) return mapped;

    mapped.node_id = targetAnchor.nodeId;
    if (mapped.node_offset && sourceAnchor?.bounds && targetAnchor.bounds) {
      const sourceWidth = sourceAnchor.bounds.width || 1;
      const sourceHeight = sourceAnchor.bounds.height || 1;
      const scaleX = targetAnchor.bounds.width ? targetAnchor.bounds.width / sourceWidth : 1;
      const scaleY = targetAnchor.bounds.height ? targetAnchor.bounds.height / sourceHeight : 1;
      mapped.node_offset.x = mapped.node_offset.x * scaleX;
      mapped.node_offset.y = mapped.node_offset.y * scaleY;
      if (typeof mapped.region_width === "number") mapped.region_width *= scaleX;
      if (typeof mapped.region_height === "number") mapped.region_height *= scaleY;
    }
    return mapped;
  }

  function createMetaForTarget(targetAnchor) {
    if (!targetAnchor?.nodeId) return null;
    const width = targetAnchor.bounds?.width || 64;
    const height = targetAnchor.bounds?.height || 64;
    return {
      node_id: targetAnchor.nodeId,
      node_offset: {
        x: Math.max(8, Math.min(width - 8, width * 0.5)),
        y: Math.max(8, Math.min(height - 8, height * 0.5)),
      },
    };
  }

  return {
    confidenceLabel,
    createMetaForTarget,
    dimensionSimilarity,
    findBestMatch,
    mapClientMeta,
    normalize,
    pathSimilarity,
    scoreCandidate,
    tokenSimilarity,
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = CommentRelayMatcher;
