import * as Yup from "yup";

export const createChValidationSchema = Yup.object({
  channelName: Yup.string()
    .trim()
    .min(2, "チャンネル名は2文字以上である必要があります")
    .max(20, "チャンネル名は20文字以内である必要があります")
    .required("チャンネル名は必須です"),

  description: Yup.string()
    .trim()
    .min(2, "説明文は2文字以上である必要があります")
    .max(2000, "説明文は2000文字以内である必要があります")
    .required("説明文は必須です"),

  isPasswordEnabled: Yup.boolean(),

  password: Yup.string().when("isPasswordEnabled", {
    is: true,
    then: (schema) =>
      schema
        .trim()
        .max(20, "パスワードは20文字以内である必要があります")
        .required("パスワードは必須です"),
    otherwise: (schema) => schema.notRequired(),
  }),

  denyGuests: Yup.boolean(),

  numberOfPlayers: Yup.number()
    .min(5, "プレイヤー数は5人以上である必要があります")
    .max(20, "プレイヤー数は20人以下である必要があります")
    .required("プレイヤー数は必須です"),
});

export const createChInitialValues = {
  channelName: "",
  description: "",
  password: "",
  isPasswordEnabled: false,
  denyGuests: false,
  numberOfPlayers: 10,
};
