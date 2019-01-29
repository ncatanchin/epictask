import {ISearchChip, ISearchChipType, OrderByChip, SortChip, TextChip} from "./Search"
import {IssueStateChip} from "renderer/search/SearchIssues"



export const AllChipTypes:Array<ISearchChipType> = [IssueStateChip, OrderByChip,SortChip,TextChip] as any

export const AllChipTypeMap = AllChipTypes.reduce((map,ChipType) => {
  map[new ChipType().type] = ChipType
  return map
}, {} as {[key:string]:ISearchChipType})

export function restoreChips<T,PK>(chips:Array<ISearchChip<T,PK>>):Array<ISearchChip<T,PK>> {
  chips = chips || []
  return chips.map(chip => {
    const ChipType = AllChipTypeMap[chip.type]
    if (!ChipType)
      throw Error(`Unknown chip type: ${chip.type}`)

    return Object.assign(new ChipType(),chip)
  })
}
