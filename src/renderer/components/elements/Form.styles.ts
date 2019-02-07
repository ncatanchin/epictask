import {
  Ellipsis, Fill,
  FillWidth, FlexAuto,
  FlexColumn, FlexRow,
  FlexRowCenter,
  FlexScale, makePaddingRem,
  PositionRelative, rem,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"


export type FormClasses = "root" | "title"

export function formBaseStyles(theme: Theme): StyleDeclaration<FormClasses> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...FlexScale, ...FlexColumn, ...FillWidth, ...PositionRelative,
      "& > .controls": {
        ...FlexRowCenter, ...makePaddingRem(1),
        "& > .note": {...FlexScale, ...Ellipsis, ...makePaddingRem(0, 1, 0, 0)},
        "& > .buttons": {
          "& > .button": {
            "& .iconLeft": {
              marginRight: theme.spacing.unit
            },
            "& .iconSmall": {
              fontSize: rem(1.6)
            }
          }
        }
      },
      "& > .row": {
        ...FlexAuto, ...FlexRowCenter, ...PositionRelative, ...FillWidth,
        //maxHeight: rem(8),
        "&.body": {
          ...FlexScale,
          ...FlexColumn,
          ...PositionRelative,
          overflowY: 'auto',
          overflowX: 'hidden',
          "& .body, & .CodeMirror": {
            ...FlexScale, ...FillWidth, ...Fill, ...PositionRelative
            //fontSize: rem(2)
          }
        },

        //"&.scale": {...FlexScale},
        "&.padding": {...makePaddingRem(1, 0)},
        "& .collaborators": {...FlexAuto},
        "& .milestone": {...FlexAuto, ...makePaddingRem(0, 1, 0, 0)}
      }
    },
    title: {...FlexScale, ...FlexRow, ...FillWidth}

  }
}
