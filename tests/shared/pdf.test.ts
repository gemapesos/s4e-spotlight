import { describe, expect, it } from "vitest"

import { buildImagesPdf } from "@/shared/pdf"
import { rgbPng } from "../helpers/png"

const text = (bytes: Uint8Array) => Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")

describe("buildImagesPdf", () => {
  it("puts each PNG on its own page, letter-wide and as tall as the image", () => {
    const pdf = text(buildImagesPdf([rgbPng(4, 2), rgbPng(2, 6)]))
    expect(pdf.startsWith("%PDF-1.4")).toBe(true)
    expect(pdf).toContain("/Count 2")
    expect(pdf).toContain("/MediaBox [0 0 612 306]")
    expect(pdf).toContain("/MediaBox [0 0 612 1836]")
    expect(pdf).toContain("/Predictor 15 /Colors 3 /BitsPerComponent 8 /Columns 4")
  })

  it("writes an xref whose offsets land on their objects", () => {
    const pdf = text(buildImagesPdf([rgbPng(3, 3)]))
    const xref = Number(/startxref\n(\d+)/u.exec(pdf)?.[1])
    const entries = pdf.slice(xref).split("\n").slice(3).filter((line) => / 00000 n $/u.test(line))
    expect(entries).toHaveLength(5)
    entries.forEach((entry, index) => expect(pdf.slice(Number(entry.slice(0, 10)))).toMatch(new RegExp(`^${index + 1} 0 obj`, "u")))
  })

  it("refuses PNGs it can't embed as they are", () => {
    expect(() => buildImagesPdf([rgbPng(2, 2, [0, 0, 0], 6)])).toThrow(/RGB/u)
    expect(() => buildImagesPdf([new Uint8Array([1, 2, 3])])).toThrow()
  })
})
