import { Swatch, Palette } from '../color'
import { Generator } from '../typing'
import { defaults, hslToRgb } from '../util'

interface DefaultGeneratorOptions {
    targetDarkLuma: number,
    maxDarkLuma: number,
    minLightLuma: number,
    targetLightLuma: number,
    minNormalLuma: number,
    targetNormalLuma: number,
    maxNormalLuma: number,
    targetMutesSaturation: number,
    maxMutesSaturation: number,
    targetVibrantSaturation: number,
    minVibrantSaturation: number,
    weightSaturation: number,
    weightLuma: number,
    weightPopulation: number
}

const DefaultOpts: DefaultGeneratorOptions = {
    targetDarkLuma: 0.26,
    maxDarkLuma: 0.45,
    minLightLuma: 0.55,
    targetLightLuma: 0.74,
    minNormalLuma: 0.3,
    targetNormalLuma: 0.5,
    maxNormalLuma: 0.7,
    targetMutesSaturation: 0.3,
    maxMutesSaturation: 0.4,
    targetVibrantSaturation: 1.0,
    minVibrantSaturation: 0.35,
    weightSaturation: 3,
    weightLuma: 6,
    weightPopulation: 1,
}

function _findMaxPopulation(swatches: Array<Swatch>): number {
    let p = 0

    swatches.forEach((s) => {
        p = Math.max(p, s.getPopulation())
    })

    return p
}

function _isAlreadySelected(palette: Palette, s: Swatch): boolean {
    return palette.Vibrant === s
        || palette.DarkVibrant === s
        || palette.LightVibrant === s
        || palette.Muted === s
        || palette.DarkMuted === s
        || palette.LightMuted === s
}

function _createComparisonValue(
    saturation: number, targetSaturation: number,
    luma: number, targetLuma: number,
    population: number, maxPopulation: number, opts: DefaultGeneratorOptions): number {

    function weightedMean(...values: number[]) {
        let sum = 0
        let weightSum = 0
        for (let i = 0; i < values.length; i += 2) {
            let value = values[i]
            let weight = values[i + 1]
            sum += value * weight
            weightSum += weight
        }

        return sum / weightSum
    }

    function invertDiff(value: number, targetValue: number): number {
        return 1 - Math.abs(value - targetValue)
    }

    return weightedMean(
        invertDiff(saturation, targetSaturation), opts.weightSaturation,
        invertDiff(luma, targetLuma), opts.weightLuma,
        population / maxPopulation, opts.weightPopulation
    )

}

function _findColorVariation(palette: Palette, swatches: Array<Swatch>, maxPopulation: number,
    targetLuma: number,
    minLuma: number,
    maxLuma: number,
    targetSaturation: number,
    minSaturation: number,
    maxSaturation: number,
    opts: DefaultGeneratorOptions): Swatch {

    let max: Swatch = null
    let maxValue = 0

    swatches.forEach((swatch) => {
        let [, s, l] = swatch.getHsl()

        if (s >= minSaturation && s <= maxSaturation
            && l >= minLuma && l <= maxLuma
            && !_isAlreadySelected(palette, swatch)
        ) {
            let value = _createComparisonValue(s, targetSaturation, l, targetLuma, swatch.getPopulation(), maxPopulation, opts)

            if (max === null || value > maxValue) {
                max = swatch
                maxValue = value
            }

        }
    })

    return max
}

function _generateVariationColors(swatches: Array<Swatch>, maxPopulation: number, opts: DefaultGeneratorOptions): Palette {
    let palette: Palette = {}
    palette.Vibrant = _findColorVariation(palette, swatches, maxPopulation,
        opts.targetNormalLuma,
        opts.minNormalLuma,
        opts.maxNormalLuma,
        opts.targetVibrantSaturation,
        opts.minVibrantSaturation,
        1,
        opts
    )
    palette.LightVibrant = _findColorVariation(palette, swatches, maxPopulation,
        opts.targetLightLuma,
        opts.minLightLuma,
        1,
        opts.targetVibrantSaturation,
        opts.minVibrantSaturation,
        1,
        opts
    )
    palette.DarkVibrant = _findColorVariation(palette, swatches, maxPopulation,
        opts.targetDarkLuma,
        0,
        opts.maxDarkLuma,
        opts.targetVibrantSaturation,
        opts.minVibrantSaturation,
        1,
        opts
    )
    palette.Muted = _findColorVariation(palette, swatches, maxPopulation,
        opts.targetNormalLuma,
        opts.minNormalLuma,
        opts.maxNormalLuma,
        opts.targetMutesSaturation,
        0,
        opts.maxMutesSaturation,
        opts
    )
    palette.LightMuted = _findColorVariation(palette, swatches, maxPopulation,
        opts.targetLightLuma,
        opts.minLightLuma,
        1,
        opts.targetMutesSaturation,
        0,
        opts.maxMutesSaturation,
        opts
    )
    palette.DarkMuted = _findColorVariation(palette, swatches, maxPopulation,
        opts.targetDarkLuma,
        0,
        opts.maxDarkLuma,
        opts.targetMutesSaturation,
        0,
        opts.maxMutesSaturation,
        opts
    )
    return palette
}

function _generateEmptySwatches(palette: Palette, maxPopulation: number, opts: DefaultGeneratorOptions): void {
    if (palette.Vibrant === null && palette.DarkVibrant !== null) {
        let [h, s, l] = palette.DarkVibrant.getHsl()
        l = opts.targetNormalLuma
        palette.Vibrant = new Swatch(hslToRgb(h, s, l), 0)
    }
    if (palette.DarkVibrant === null && palette.Vibrant !== null) {
        let [h, s, l] = palette.Vibrant.getHsl()
        l = opts.targetDarkLuma
        palette.DarkVibrant = new Swatch(hslToRgb(h, s, l), 0)
    }
}

const DefaultGenerator: Generator = (swatches: Array<Swatch>, opts?: DefaultGeneratorOptions): Palette => {
    opts = <DefaultGeneratorOptions>defaults({}, opts, DefaultOpts)
    let maxPopulation = _findMaxPopulation(swatches)

    let palette = _generateVariationColors(swatches, maxPopulation, opts)
    _generateEmptySwatches(palette, maxPopulation, opts)

    return palette
}

export default DefaultGenerator