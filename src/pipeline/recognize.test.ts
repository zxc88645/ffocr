import { describe, it, expect } from "vitest";
import { decodeRecognitionOutput } from "./recognize";

const DICTIONARY = ["a", "b", "c", "d", "e"];

function makeOutput(
  batch: number,
  timeSteps: number,
  classes: number,
  fill: (batchIdx: number, step: number, classIdx: number) => number
): { data: Float32Array; dims: [number, number, number] } {
  const data = new Float32Array(batch * timeSteps * classes);
  for (let b = 0; b < batch; b++) {
    for (let t = 0; t < timeSteps; t++) {
      for (let c = 0; c < classes; c++) {
        data[(b * timeSteps + t) * classes + c] = fill(b, t, c);
      }
    }
  }
  return { data, dims: [batch, timeSteps, classes] };
}

describe("decodeRecognitionOutput", () => {
  it("decodes a simple sequence", () => {
    const classes = DICTIONARY.length + 1; // +1 for blank
    const { data, dims } = makeOutput(1, 5, classes, (_b, step, classIdx) => {
      // step 0 -> class 1 ("a"), step 1 -> class 2 ("b"), step 2 -> class 3 ("c")
      // step 3 -> blank (0), step 4 -> class 4 ("d")
      const targets = [1, 2, 3, 0, 4];
      return classIdx === targets[step] ? 10 : -10;
    });

    const results = decodeRecognitionOutput(data, dims, DICTIONARY);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("abcd");
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("collapses repeated indices (CTC decoding)", () => {
    const classes = DICTIONARY.length + 1;
    const { data, dims } = makeOutput(1, 5, classes, (_b, step, classIdx) => {
      // a, a, b, b, c -> should decode to "abc"
      const targets = [1, 1, 2, 2, 3];
      return classIdx === targets[step] ? 10 : -10;
    });

    const results = decodeRecognitionOutput(data, dims, DICTIONARY);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("abc");
  });

  it("uses blank to separate identical characters", () => {
    const classes = DICTIONARY.length + 1;
    const { data, dims } = makeOutput(1, 5, classes, (_b, step, classIdx) => {
      // a, blank, a, blank, a -> "aaa"
      const targets = [1, 0, 1, 0, 1];
      return classIdx === targets[step] ? 10 : -10;
    });

    const results = decodeRecognitionOutput(data, dims, DICTIONARY);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("aaa");
  });

  it("returns empty text when all predictions are blank", () => {
    const classes = DICTIONARY.length + 1;
    const { data, dims } = makeOutput(1, 4, classes, (_b, _step, classIdx) => {
      return classIdx === 0 ? 10 : -10;
    });

    const results = decodeRecognitionOutput(data, dims, DICTIONARY);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("");
    expect(results[0].score).toBe(0);
  });

  it("handles multiple batches", () => {
    const classes = DICTIONARY.length + 1;
    const { data, dims } = makeOutput(2, 3, classes, (batchIdx, step, classIdx) => {
      if (batchIdx === 0) {
        const targets = [1, 2, 3]; // "abc"
        return classIdx === targets[step] ? 10 : -10;
      }
      const targets = [4, 5, 0]; // "de"
      return classIdx === targets[step] ? 10 : -10;
    });

    const results = decodeRecognitionOutput(data, dims, DICTIONARY);
    expect(results).toHaveLength(2);
    expect(results[0].text).toBe("abc");
    expect(results[1].text).toBe("de");
  });

  it("throws on unsupported output shape", () => {
    expect(() =>
      decodeRecognitionOutput(new Float32Array(10), [10], DICTIONARY)
    ).toThrow("Unsupported recognition output shape");

    expect(() =>
      decodeRecognitionOutput(new Float32Array(10), [1, 2, 3, 4], DICTIONARY)
    ).toThrow("Unsupported recognition output shape");
  });

  it("handles custom blankIndex", () => {
    const classes = DICTIONARY.length + 1;
    const { data, dims } = makeOutput(1, 3, classes, (_b, step, classIdx) => {
      // blank=2, so class 0 -> dict[-1] is undefined, class 1 -> "a"
      const targets = [1, 2, 3]; // "a", blank, "c" -> skip undefined
      return classIdx === targets[step] ? 10 : -10;
    });

    const results = decodeRecognitionOutput(data, dims, DICTIONARY, { blankIndex: 2 });
    expect(results).toHaveLength(1);
    // class 1 -> dictionary[0] = "a", class 3 -> dictionary[2] = "c"
    expect(results[0].text).toContain("a");
  });
});
