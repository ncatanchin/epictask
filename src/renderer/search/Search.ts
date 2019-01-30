import * as React from "react"
import getLogger from "common/log/Logger"
import Dexie from "dexie"
import * as _ from "lodash"
import {flatten, sortBy} from "lodash"
import {scanObjects} from "./SearchUtil"


const log = getLogger(__filename)

export interface ISearchChipComponentProps<T, PK, V> {
  chip: ISearchChip<T, PK, V>
  onRemove: (chip: ISearchChip<T, PK, V>) => void
  theme: Theme
}

export type SearchChipComponent<T, PK, V> =
  (props: ISearchChipComponentProps<T, PK, V>) => React.ReactElement<ISearchChipComponentProps<T, PK, V>>

//, Table extends Dexie.Table<T,PK> = DB[TableName]
export interface ISearchChipData<V = string> {
  type: string
  key: string
  value: V
}

export interface ISearchChip<T = any, PK = any, V = any, D extends ISearchChipData<V> = any> extends ISearchChipData<V> {
  readonly type: string
  readonly id: string
  readonly color?: string | null
  readonly description: string
  readonly valueAsString: string
  readonly filter: ISearchFilter<T, PK, V>
  readonly label?: (props: ISearchChipComponentProps<T, PK, V>) => React.ReactElement<ISearchChipComponentProps<T, PK, V>>
  data: () => D
}

export interface ISearchChipType<T = any, PK = any, V = any, D extends ISearchChipData<V> = any, ChipType extends ISearchChip<T, PK, V, D> = any> {
  new(...args: any[]): ChipType
}


export interface ISearchFilter<T = any, PK = any, V = any, D extends ISearchChipData<V> = any> {
  supportedChips: Array<ISearchChipType>
  name: string

  hydrate(data: D): ISearchChip

  filter(chips: Array<ISearchChip<T, PK, V, D>>, results: T[]): T[]

  searchChips(text: string): Array<ISearchChip<T, PK, V, D>>
}

export class SearchProvider<DB extends Dexie, TableName extends keyof DB, T, PK, V = any> {

  defaultChips:Array<ISearchChip>

  constructor(public db: DB, public tableName: TableName, private filters: Array<ISearchFilter<T, PK, V>>,...defaultChips:Array<ISearchChip>) {
    this.defaultChips = defaultChips
  }


  /**
   * Search for chips
   *
   * @param {string} text
   * @returns {Array<ISearchChip<T, PK>>}
   */
  searchChips(text: string): Array<ISearchChip<T, PK, V>> {
    return flatten(this.filters.map(filter => filter.searchChips(text))).unique(chip => chip.id)
  }


  hydrate(searchChipData: Array<ISearchChipData>):Array<ISearchChip> {
    const chips = Array<ISearchChip>()
    for (const chipData of searchChipData) {
      for (const filter of this.filters) {
        const chipTypes = filter.supportedChips.map(chipType => chipType.name)
        if (chipTypes.includes(chipData.type)) {
          chips.push(filter.hydrate(chipData))
          break
        }
      }
    }
    return chips
  }

  filter(chips: Array<ISearchChip> | null, items: Array<T>): Array<T> {
    chips = chips || []
    if (!chips.length)
      chips = [...this.defaultChips]

    let results = [...items]
    this.filters.forEach(filter => {
      results = filter.filter(chips as any, results)
    })
    return results
  }

  /**
   * Query for models
   *
   * @param {Array<ISearchChip<T, PK>>} chips
   * @returns {Array<T>}
   */
  async query(chips: Array<ISearchChip<T, PK, V>>): Promise<Array<T>> {
    const table: Dexie.Table<T, PK> = this.db.tables[this.tableName as any] as any
    let results = await table.toArray()

    // NOW FILTER
    this.filters.forEach(filter => {
      results = filter.filter(chips, results)
    })

    return results
  }

}

interface IOrderByData<V = string> extends ISearchChipData<V> {
  field: string
}

export class OrderByChip<T,
  PK,
  V extends string = string,
  D extends IOrderByData<V> = IOrderByData<V>,
  F extends OrderByFilter<T, PK, V, D> = OrderByFilter<T, PK, V, D>,
  > implements ISearchChip<T, PK, V, D> {

  type = this.constructor.name

  id = `order-by-${this.value}`

  constructor(
    public filter: F,
    public key: string,
    public value: V,
    public field: string
  ) {
  }

  get description(): string {
    return `Order by ${this.value}`
  }

  get valueAsString(): string {
    return this.value
  }

  data() {
    return {
      type: this.type,
      key: this.key,
      value: this.value,
      field: this.field
    } as D
  }
}


export class OrderByFilter<T, PK, V extends string = string, D extends IOrderByData<V> = IOrderByData<V>> implements ISearchFilter<T, PK, V, D> {

  supportedChips: Array<ISearchChipType> = [OrderByChip]

  name: string = this.constructor.name

  constructor(public fields: Array<keyof T & string>, public defaultField: keyof T & string = null) {

  }

  hydrate(data: D): OrderByChip<T, PK, V, D> {
    return new OrderByChip<T, PK, V, D>(this, "orderBy", data.value, data.field)
  }

  filter(chips: Array<ISearchChip<T, PK, V, D>>, results: T[]): T[] {
    const
      orderByChip: OrderByChip<T, PK, V, D> | null = chips.find(chip => chip instanceof OrderByChip) as any,
      sortChip: SortChip<T, PK, V, D> | null = chips.find(chip => chip instanceof SortChip) as any,
      field = orderByChip ? orderByChip.field : this.defaultField

    results = !field ? results : sortBy(results, field)
    if (!sortChip || !sortChip.asc) {
      results = results.reverse()
    }
    return results
  }

  searchChips(text: string): Array<ISearchChip<T, PK, V, D>> {
    return this.fields
      .filter(field => field.toLowerCase().includes(text.toLowerCase()))
      .map(field => new OrderByChip<T, PK, V, D>(this, 'orderBy', field as any, field)) as any
  }

}


export class SortChip<T,
  PK,
  V extends string,
  D extends ISearchChipData<V> = ISearchChipData<V>,
  F extends SortFilter<T, PK, V, D> = SortFilter<T, PK, V, D>> implements ISearchChip<T, PK, V, D> {

  type = this.constructor.name
  id = `sort-${this.value}`

  constructor(
    public filter: F,
    public key: string,
    public value: V,
    public asc: boolean
  ) {
  }

  get description(): string {
    return `Sort ${this.asc ? "ascending" : "descending"}`
  }

  get valueAsString(): string {
    return this.asc ? "ascending" : "descending"
  }

  data() {
    return {
      type: this.type,
      key: this.key,
      value: this.value
    } as D
  }
}

export class SortFilter<T, PK,
  V extends string,
  D extends ISearchChipData<V> = ISearchChipData<V>> implements ISearchFilter<T, PK, V, D> {

  static Directions = {Ascending: true, Descending: false}

  supportedChips = [SortChip]

  name: string = this.constructor.name

  hydrate(data: D): SortChip<T, PK, V, D> {
    return new SortChip<T, PK, V, D>(this, "sort", data.value, data.value === "Ascending")
  }

  filter(chips: Array<ISearchChip<T, PK, V, D>>, results: T[]): T[] {
    return results
  }

  searchChips(text: string): Array<ISearchChip<T, PK, V, D>> {
    return Object.keys(SortFilter.Directions)
      .filter(dir => dir.toLowerCase().includes(text.toLowerCase()))
      .map(dir => new SortChip<T, PK, V, D, SortFilter<T, PK, V, D>>(this, 'sort', dir as any, SortFilter.Directions[dir])) as any
  }

}


export class TextChip<T,
  PK,
  V extends string = string,
  F extends TextFilter<T, PK, V> = TextFilter<T, PK, V>> implements ISearchChip<T, PK, V> {

  type = this.constructor.name

  get id(): string {
    return `text-${this.text}`
  }

  constructor(
    public filter: ISearchFilter<T, PK, V>,
    public key: string,
    public value: V,
    public text: string
  ) {
  }

  get description(): string {
    return `Text includes ${this.value}`
  }

  get valueAsString(): string {
    return this.text
  }

  data() {
    return {
      type: this.type,
      key: this.key,
      value: this.value,
      text: this.text
    }
  }
}


export class TextFilter<T, PK, V extends string = string> implements ISearchFilter<T, PK, V> {

  supportedChips = [TextChip]

  fields: Array<keyof T>

  hydrate(data: ISearchChipData<V>): TextChip<T, PK, V> {
    return new TextChip<T, PK, V>(this, "text", data.value, data.value)
  }

  constructor(fields: Array<keyof T>, public labelMaker: SearchChipComponent<T, PK, TextChip<T, PK>> | null = null) {
    this.fields = fields
  }

  name: string = this.constructor.name


  filter(chips: Array<ISearchChip<T, PK, V>>, results: T[]): T[] {
    const texts = chips
      .filter(chip => chip instanceof TextChip)
      .map((chip: TextChip<T, PK, V>) => chip.text)

    if (texts.length) {
      results = results.filter(result => {
        const values = this.fields.map(field => _.get(result, field))
        return texts.every(text => scanObjects(text, ...values))
      })
    }
    return results
  }

  searchChips(text: string): Array<ISearchChip<T, PK, V>> {
    return [text].map(() => new TextChip<T, PK, V, TextFilter<T, PK, V>>(this, 'text', text as V, text)) as any
  }

}
