
import {makePalette, Palettes} from '../material/MaterialTools'

export function DarkPalette() {
	return makePalette(
		'DarkPalette',
		Palettes.grey,
		[ 'l900', '#303030', 'l800', 'l700' ],
		Palettes.purple,
		[ 'l400', 'l300', 'l200', 'l100' ],
		// Palettes.teal,
		// ['l400', 'l200', 'l100', 'l50'],
		Palettes.lightBlue,
		[ 'A700', 'A400', 'A200', 'A100' ],
		Palettes.red,
		[ 'l400', 'l200', 'l100', 'l50' ],
		Palettes.green,
		[ 'A700', 'A400', 'A200', 'A100' ],
		Palettes.black,
		true
	)
}


export namespace DarkPalette {
	export const PaletteName = 'DarkPalette'
}


export default DarkPalette