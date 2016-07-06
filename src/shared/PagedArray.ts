

export enum PageLinkType {
	next = 1,
	last,
	first,
	prev
}

export class PageLink {
	type:PageLinkType
	url:string
	pageNumber:number

	/**
	 * Takes a raw header value consisting of 1 or more links
	 * and generates an array of PageLink's
	 *
	 * @example
	 *  rawlinks = "<https://api.github.com/user/repos?page=2>; rel="next", <https://api.github.com/user/repos?page=4>; rel="last""
	 *
	 * @param rawHeader
	 * @returns {PageLink[]}
	 */
	static parseLinkHeader(rawHeader:string) {
		if (!rawHeader)
			return {}

		return rawHeader.split(',')
			.map(rawLink => new PageLink(rawLink))
			.reduce((linkMap,nextLink) => {
				linkMap[nextLink.type] = nextLink
				return linkMap
			},{})
	}

	/**
	 * Represents additional pagination links
	 *
	 * @param rawLink
	 */
	constructor(public rawLink:string) {
		const parts = rawLink.split(';')

		// Parse the url
		this.url = parts[0].replace(/(<|>)/g,'')

		// Page number from url
		const pageNumberStr = /(?:page=)(.*)(?:(&|$))/.exec(this.url)[1]
		this.pageNumber = parseInt(pageNumberStr)

		// Type from rel tag
		const typeStr = /(?:")(.*)(?:"$)/.exec(parts[1])[1]
		this.type = PageLinkType[typeStr]
	}
}

export type PageLinks = {[type:number]:PageLink}


export class PagedArray<T extends any> extends Array<T> {
	constructor(items,public pageNumber,public pageLinks:PageLinks,public etag:string = null) {
		super(...items)
	}

	/**
	 * Check if this is the last page
	 * @returns {boolean}
	 */
	get isLastPage() {
		const lastPageLink = this.pageLinks[PageLinkType.last]
		return _.isNil(lastPageLink) || lastPageLink.pageNumber === this.pageNumber
	}

}
