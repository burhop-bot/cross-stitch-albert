import { describe, it, expect } from 'vitest'
import { deltaE76, rgbToLAB, rgbToXYZ } from '../colorDistance'

describe('RGB to XYZ Conversion', () => {
  it('converts black to XYZ', () => {
    const xyz = rgbToXYZ(0, 0, 0)
    expect(xyz[0]).toBe(0)
    expect(xyz[1]).toBe(0)
    expect(xyz[2]).toBe(0)
  })

  it('converts white to XYZ with L component', () => {
    const xyz = rgbToXYZ(255, 255, 255)
    expect(xyz[0]).toBeGreaterThan(90)
    expect(xyz[1]).toBeGreaterThan(90)
    expect(xyz[2]).toBeGreaterThan(90)
  })
})

describe('RGB to LAB Conversion', () => {
  it('converts white to LAB with L~100', () => {
    const lab = rgbToLAB(255, 255, 255)
    expect(lab[0]).toBeGreaterThan(99)
  })

  it('converts black to LAB with L~0', () => {
    const lab = rgbToLAB(0, 0, 0)
    expect(lab[0]).toBeLessThan(1)
  })
})

describe('Delta-E 76', () => {
  it('returns 0 for identical colors', () => {
    const lab1 = rgbToLAB(255, 0, 0)
    const lab2 = rgbToLAB(255, 0, 0)
    const d = deltaE76(lab1, lab2)
    expect(d).toBeCloseTo(0, 10)
  })

  it('white vs black has large Delta-E', () => {
    const white = rgbToLAB(255, 255, 255)
    const black = rgbToLAB(0, 0, 0)
    const d = deltaE76(white, black)
    expect(d).toBeGreaterThan(99)
  })

  it('red vs green has moderate Delta-E', () => {
    const red = rgbToLAB(255, 0, 0)
    const green = rgbToLAB(0, 255, 0)
    const d = deltaE76(red, green)
    expect(d).toBeGreaterThan(70)
    expect(d).toBeLessThan(180)
  })
})
