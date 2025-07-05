import * as Yup from "yup";

export const channelValidationSchema = Yup.object({
  newMessage: Yup.string()
    .trim()
    .max(300, "メッセージは300文字までです")
    .required(""),
});
