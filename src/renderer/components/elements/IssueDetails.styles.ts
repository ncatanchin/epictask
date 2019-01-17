import {
  directChild,
  Ellipsis,
  Fill,
  FillWidth,
  FillHeight,
  FlexAuto,
  FlexColumn,
  FlexColumnCenter,
  FlexRow,
  FlexRowCenter,
  FlexScale,
  makeDimensionConstraint,
  makeDimensionConstraints,
  makeHeightConstraint,
  makeMarginRem,
  makePaddingRem, makeWidthConstraint,
  NestedStyles,
  OverflowAuto,
  OverflowHidden,
  PositionAbsolute,
  PositionRelative,
  rem
} from "renderer/styles/ThemedStyles"
import {Color} from "csstype"
import {Run} from "common/util/fn"
import {elevationStyles} from "renderer/components/elements/Elevation"


declare global {
  type IssueDetailsColor =
    "none" |
    "bg" |
    "number" |
    "updatedAt" |
    "commentHeader" |
    "commentHeaderBg" |
    "commentBorder" |
    "connection" |
    "topBg" |
    "boxShadow" |
    "dividerBoxShadow" |
    "text"
  type IssueDetailsColors = { [key in IssueListItemColor]: Color }

  interface IIssueDetailsStyles {
    colors: IssueDetailsColors
  }
}

export default function baseStyles(theme: Theme): NestedStyles {
  const
    {palette, focus, components: {IssueListItem, IssueDetails}} = theme,
    {colors} = IssueDetails,
    {primary, secondary} = palette

  return {
    root: [Fill, OverflowHidden, FlexColumnCenter, {
      background: IssueDetails.colors.bg
    }],
    none: [FlexAuto, {
      color: colors.none,
      fontSize: rem(1.4)
    }],
    top: [FlexColumnCenter, {}],
    info: [makePaddingRem(0.5, 1), FlexAuto, FillWidth, FlexRowCenter, {
      background: IssueListItem.colors.normal.topBg,
      [directChild("number")]: [FlexAuto, makePaddingRem(0, 0.5, 0, 0), {
        alignSelf: "flex-start",
        fontSize: rem(1.2),
        fontWeight: 700,
        color: IssueListItem.colors.normal.number
      }],
      [directChild("top")]: [FlexScale, FlexColumnCenter, {
        [directChild("title")]: [FlexAuto, FillWidth, makePaddingRem(0, 0.5, 0, 0), Ellipsis, {
          fontSize: rem(1),
          fontWeight: 500,
          color: IssueListItem.colors.normal.text

        }],
        [directChild("subtitle")]: [FlexAuto, FillWidth, {
          fontSize: rem(1),
          color: IssueListItem.colors.normal.subtitle
        }]
      }]
    }],
    events: Run(() => {
      const
        commentBorder = `${rem(0.1)} ${colors.commentBorder} solid`,
        connectionBorder = `${rem(0.1)} ${colors.connection} solid`

      return [FlexScale, FillWidth, FlexColumn, OverflowHidden, makePaddingRem(0, 0,1), {
        [directChild("items")]: [FlexScale, FillWidth, FlexColumn, OverflowAuto, {
          [directChild("activity")]: [PositionRelative, FlexAuto, FlexRow, FillWidth, makePaddingRem(1, 2, 1, 3.5), {
            color: colors.commentText,
            [directChild("content")]: [FlexRow, makePaddingRem(0.5, 1, 0.5, 3), {
              alignItems: "center"
            }],
            [directChild("connection")]: [FillHeight, PositionAbsolute, makeWidthConstraint(rem(1.6)), {
              left: rem(3.2),
              bottom: 0,
              [directChild("line")]: [PositionAbsolute, makeWidthConstraint(rem(0.2)), FillHeight, {
                left: rem(0.8),
                top: 0,
                background: colors.connection,
                "&.last": [makeHeightConstraint("50%"), {}]
              }],
              [directChild("icon")]: [PositionAbsolute, makeDimensionConstraints(rem(1.6)), {
                left: `50%`,
                top: `50%`,
                marginLeft: `-0.7rem`,
                marginTop: `-0.7rem`,
                borderRadius: rem(0.8),
                background: colors.connection,
                border: connectionBorder
              }]
            }],
            [directChild("bottom")]: [PositionAbsolute,makeHeightConstraint(rem(0)),{
              bottom: 0,
              left: rem(4),
              right: 0,
              borderBottom: connectionBorder
            }]

          }],

          [directChild("comment")]: [PositionRelative, FlexAuto, FlexRow, FillWidth, makePaddingRem(0, 1, 1.5, 1), {
            [directChild("container")]: [PositionRelative, FlexScale, makeMarginRem(0, 0, 0, 2.2), {
              color: colors.commentText,
              border: commentBorder,
              borderRadius: rem(0.2),
              [directChild("content")]: [FlexColumn, {
                background: colors.commentHeaderBg,
                [directChild("top")]: [makePaddingRem(0, 1), FlexAuto, FlexRowCenter, FillWidth, makeHeightConstraint(rem(2.2)), {
                  borderBottom: commentBorder,
                  [directChild("text")]: [Ellipsis, FlexScale]
                }],
                [directChild("bottom")]: [makePaddingRem(1), FlexAuto, FlexRowCenter, FillWidth, {
                  background: colors.commentBodyBg,
                  borderBottom: commentBorder,
                  [directChild("text")]: [Ellipsis, FlexScale]
                }]
              }]
            }],

            [directChild("creator")]: [PositionAbsolute, FlexRowCenter, makeDimensionConstraints(rem(2.3)), makePaddingRem(0.1, 0.1, 0, 0), {
              background: colors.commentHeaderBg,
              top: 0,
              left: rem(1),
              borderTopLeftRadius: rem(1.2),
              borderBottomLeftRadius: rem(1.2),
              borderLeft: commentBorder,
              borderTop: commentBorder,
              borderBottom: commentBorder,
              [directChild("avatar")]: [makeDimensionConstraints(rem(2)), {
                borderRadius: rem(1)
              }]
            }],
            [directChild("connection")]: [PositionAbsolute, makeWidthConstraint(rem(0.2)), makeHeightConstraint(rem(1.6)), {
              left: rem(4),
              bottom: 0,
              background: colors.connection,
              // borderLeft: connectionBorder,
              // borderTop: connectionBorder,
              // borderBottom: connectionBorder,
              "&.last": [{
                opacity: 0
              }]
            }]
          }]
        }]
      }]
    })
  }
}
