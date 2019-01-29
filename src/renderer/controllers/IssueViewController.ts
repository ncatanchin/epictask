import Controller from "renderer/controllers/Controller"
import {isNumber} from "typeguard"


export default class IssueViewController extends Controller {


  focusedContentId:number = -1
  editContentId:number = -1

  dirtyContent:boolean = false
  newComment:boolean = false

  constructor(public issueId:number = -1) {
    super()
    this.focusedContentId = issueId
  }

  setIssueId(id:number):this {
    return id === this.issueId ? this : Object.assign(this.clone(),{
      issueId: id,
      focusedContentId: id,
      editContentId: -1
    })
  }

  setFocusedContentId(id:number):this {
    return Object.assign(this.clone(),{
      focusedContentId: isNumber(id) && id > -1 ? id : this.issueId
    })
  }

  setEditContentId(id:number):this {
    return Object.assign(this.clone(),{
      dirtyContent: false,
      newComment: false,
      editContentId: id,
      focusedContentId: id
    })
  }

  isEditingContent():boolean {
    return this.editContentId > -1 || this.newComment
  }

  isNewComment():boolean {
    return this.newComment
  }

  setNewComment(newComment:boolean = true):this {
    return Object.assign(this.clone(),{
      dirtyContent: false,
      newComment,
      editContentId: -1
    })
  }

  isDirtyContent():boolean {
    return this.dirtyContent && this.isEditingContent()
  }

  setIsDirtyContent(dirtyContent:boolean):this {
    return Object.assign(this.clone(),{
      dirtyContent
    })
  }

}
