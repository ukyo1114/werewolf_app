import * as Yup from "yup";

export const chSettingsValidationSchema = Yup.object({
  isChannelNameChanged: Yup.boolean(),
  isDescriptionChanged: Yup.boolean(),
  isPasswordChanged: Yup.boolean(),

  channelName: Yup.string().when("isChannelNameChanged", {
    is: true,
    then: (schema) =>
      schema
        .trim()
        .min(2, "チャンネル名は2文字以上である必要があります")
        .max(20, "チャンネル名は20文字以内である必要があります")
        .required("チャンネル名は必須です"),
    otherwise: (schema) => schema.notRequired(),
  }),

  description: Yup.string().when("isDescriptionChanged", {
    is: true,
    then: (schema) =>
      schema
        .trim()
        .min(2, "説明文は2文字以上である必要があります")
        .max(2000, "説明文は2000文字以内である必要があります")
        .required("説明文は必須です"),
    otherwise: (schema) => schema.notRequired(),
  }),

  password: Yup.string().when("isPasswordChanged", {
    is: true,
    then: (schema) =>
      schema
        .trim()
        .max(20, "パスワードは20文字以内である必要があります"),
    otherwise: (schema) => schema.notRequired(),
  }),
});