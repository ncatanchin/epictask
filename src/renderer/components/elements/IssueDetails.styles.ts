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
  rem, CursorPointer, makeTransition, Transparent, remToPx, StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {Color} from "csstype"
import {Run} from "common/util/fn"
import {darken} from "@material-ui/core/styles/colorManipulator"

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

export default function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette, focus, dimensions, components: {IssueListItem, IssueDetails, Button}} = theme,
    {colors} = IssueDetails,
    {primary, secondary,action} = palette

  return {
    markdown: [OverflowAuto,{
      maxWidth: "100%"
    }],
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
        color: IssueListItem.colors.normal.text
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
        connectionBorder = `${rem(0.1)} ${colors.connection} solid`,
        focusedBorder = `${rem(0.1)} ${colors.focusColor} solid`


      return [FlexScale, FillWidth, FlexColumn, OverflowHidden, makePaddingRem(0, 0, 1), {
        [directChild("items")]: [PositionRelative, FlexScale, FillWidth, FlexColumn, makePaddingRem(0, 0, 0.2,0), {
          overflowY: "auto",
          overflowX: "hidden",
          [directChild("activity")]: [PositionRelative, FlexAuto, FlexRow, FillWidth, makePaddingRem(1, 2, 1, 3.7), {
            maxWidth: `calc(100% - ${rem(5.7)})`,
            color: colors.commentText,
            [directChild("content")]: [FlexRow, makePaddingRem(0.5, 1, 0.5, 3), {
              alignItems: "center"
            }],
            [directChild("connection")]: [FillHeight, PositionAbsolute, makeWidthConstraint(rem(1.6)), {
              left: rem(4.2),
              bottom: 0,
              [directChild("line")]: [PositionAbsolute, makeWidthConstraint(rem(0.15)), FillHeight, {
                left: rem(0.7),
                top: 0,
                background: colors.connection
              }],
              [directChild("icon")]: [PositionAbsolute, makeDimensionConstraints(rem(1.4)), {
                left: `50%`,
                top: `50%`,
                marginLeft: `-0.7rem`,
                marginTop: `-0.7rem`,
                borderRadius: rem(0.7),
                background: colors.connection,
                border: connectionBorder
              }]
            }],
            [directChild("bottom")]: [PositionAbsolute, makeHeightConstraint(rem(0)), {
              bottom: 0,
              left: rem(5),
              right: rem(4),
              borderBottom: connectionBorder
            }]

          }],

          [directChild("comment")]: [makeTransition("backgroundColor"),PositionRelative, FlexAuto, FillWidth, OverflowHidden, makePaddingRem(0, 1, 0, 1), FlexRow, { //
            "&.focused": {
              backgroundColor: darken(colors.commentBodyBg,0.4),
            },
            "& > .commentInternal": [FlexScale, FlexRow, PositionRelative,{
              maxWidth: `calc(100% - ${rem(2)})`,
              "&.first": [makePaddingRem(1, 1, 0.5, 1), {
                "&::before": [PositionAbsolute, makeHeightConstraint(rem(1)), {
                  left: rem(4),
                  top: 0,
                  content: "' '",
                  //background: colors.connection,
                  right: rem(2),
                  borderLeft: connectionBorder,
                  borderBottom: connectionBorder
                }]
              }],

              // CONNECTORS WHEN UNDER A COMMENT AND MARKED LAST ARE NOT VISIBLE
              "& > .connection": [makeHeightConstraint(rem(0.6)), {
                "&.last": [makeDimensionConstraints(0), {
                  opacity: 0,
                  background: Transparent
                }]}],

              [directChild("container")]: [makeTransition("border"),PositionRelative, FlexScale, makeMarginRem(0, 0, 0.5, 3.2), {
                maxWidth: `calc(100% - ${rem(3.2)})`,
                "&.first": [{
                  marginTop: rem(1)
                }],
                color: colors.commentText,
                border: connectionBorder,
                borderRadius: rem(0.3),
                borderTopLeftRadius: 0,
                "&.focused": [{
                  //border: focusedBorder,
                  "& > .content > .top": [{
                    //borderBottom: focusedBorder,
                    //backgroundColor: colors.focusColor,
                    color: colors.focusColorText
                  }]
                }],
                [directChild("content")]: [PositionRelative, FlexColumn, {
                  borderBottomRightRadius: rem(0.3),
                  borderTopRightRadius: rem(0.3),
                  borderBottomLeftRadius: rem(0.3),
                  background: colors.commentHeaderBg,
                  [directChild("top")]: [makeTransition(['backgroundColor','color','borderBottom']),makePaddingRem(0, 1), FlexAuto, FlexRowCenter, FillWidth, makeHeightConstraint(rem(2.2)), {
                    borderBottom: connectionBorder,
                    color: colors.commentText,
                    [directChild("text")]: [Ellipsis, FlexScale],
                    [directChild("editButton")]: [Button.overlayFAB, FlexRowCenter, CursorPointer, makeDimensionConstraints(dimensions.button.small * 1.5), {
                      marginLeft: theme.spacing.unit,
                      // zIndex: 1,
                      // right: theme.spacing.unit / 2,
                      // top: theme.spacing.unit / 2,
                      '& svg': [makeDimensionConstraints(dimensions.button.small)]
                    }]
                  }],
                  [directChild("bottom")]: [makePaddingRem(0.5, 1), PositionRelative, FlexAuto, FillWidth, {
                    background: colors.commentBodyBg,
                    //borderBottom: commentBorder,
                    [directChild("text")]: [FlexScale, FlexRow, makePaddingRem(0.5), PositionRelative, OverflowHidden, {
                      "&.edit": [makePaddingRem(0), {
                        "& > .editor": [Fill, FlexColumn, FillWidth, {
                          minHeight: rem(8),

                          "& > .markdown": [FlexAuto, {
                            minHeight: rem(5),
                            flexGrow: 1
                          }],
                          "& > .controls": [FlexAuto, FlexRowCenter, FillWidth, makePaddingRem(0,0,0,1), {
                            "& > .note": [FlexScale, {}],
                            "& > .buttons": [FlexAuto, {
                              "& > .button": [{
                                "& .iconLeft": [{
                                  marginRight: theme.spacing.unit
                                }],
                                "& .iconSmall": [{
                                  fontSize: rem(1.6)
                                }]

                              }]
                            }]
                          }]
                        }]
                      }]
                    }],
                    "&.edit": [makePaddingRem(0)]
                  }]
                }]
              }],

              [directChild("creator")]: [makeTransition(["border-left","border-top","border-bottom","background"]),PositionAbsolute, FlexRowCenter, makeDimensionConstraints(rem(2.3)), makePaddingRem(0.1, 0.1, 0, 0), {
                overflow: 'visible',
                background: colors.commentHeaderBg,
                top: 0,
                left: remToPx(1),
                borderTopLeftRadius: rem(1.2),
                borderBottomLeftRadius: rem(1.2),
                borderLeft: connectionBorder,
                borderTop: connectionBorder,
                borderBottom: connectionBorder,
                // "&::after": [PositionAbsolute,makeWidthConstraint(rem(0.3)),makeHeightConstraint(rem(0.1)),{
                //   top: -2,
                //   right: -1,
                //   //transform: `translate(${rem(0.2)},-1px)`,
                //   // top: rem(-0.1),
                //   // right:rem(-0.1),
                //   //borderTop: connectionBorder,
                //   background: colors.connection,
                //   content: "' '"
                // }],
                "&.first": [{
                  top: remToPx(1)
                }],
                "&.focused": {
                  //background: colors.focusColor,
                  // borderLeft: focusedBorder,
                  // borderTop: focusedBorder,
                  // borderBottom: focusedBorder,
                  "&::after": [{
                    //borderTop: focusedBorder,
                    background: action.main,
                  }]
                },
                [directChild("avatar")]: [makeDimensionConstraints(remToPx(2.05)), {
                  borderRadius: remToPx(1)
                }]
              }],
              [directChild("connection")]: [PositionAbsolute, makeWidthConstraint(rem(0.15)), makeHeightConstraint(rem(0.5)), {
                left: rem(3.9),
                bottom: 0,
                background: colors.connection
              }]
            }]
          }]
        }]
      }]
    })
  }
}
