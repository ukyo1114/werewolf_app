import { useEffect, useReducer, useCallback, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";

import {
  Box,
  Flex,
  Stack,
  FormControl,
  Spinner,
  Textarea,
  IconButton,
} from "@chakra-ui/react";
import { Formik, Form, Field, ErrorMessage } from "formik";

import { BiSend } from "react-icons/bi";

import { useUserState } from "../../context/UserProvider.jsx";
import useChatMessages from "../../hooks/useChatMessages";
import useChatSocket from "../../hooks/useChatSocket";
import { channelValidationSchema } from "../channel/validationSchema";
import DisplayMessage from "./DisplayMessage.jsx";
import { GAME_MASTER } from "../../constants";
import messagesReducer from "../../reducers/messageReducer";

const Channel = () => {
  const [messages, mDispatch] = useReducer(messagesReducer, []);
  const { user, currentChannel, chDispatch } = useUserState();
  const scrollRef = useRef(null);
  const isScrollRef = useRef(null);
  const messagesCompletedRef = useRef(null);

  const { users, blockUsers } = currentChannel;

  const { loading, fetchMessages, sendMessage } = useChatMessages({
    messages,
    mDispatch,
    messagesCompletedRef,
  });

  const isSocketConnected = useChatSocket({ mDispatch });

  const handleSendMessage = async (values, actions) => {
    const { newMessage } = values;
    await sendMessage(newMessage);
    actions.setSubmitting(false);
    actions.resetForm();
  };

  const handleScroll = useCallback(async () => {
    // 外部化
    if (scrollRef.current && isSocketConnected) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop >= 0) {
        isScrollRef.current = false;
      } else {
        isScrollRef.current = true;
      }
      if (
        scrollTop + scrollHeight - clientHeight <= 1 &&
        !messagesCompletedRef.current
      ) {
        const prevScrollTop = scrollTop;
        await fetchMessages();
        setTimeout(() => {
          scrollRef.current.scrollTop = prevScrollTop;
        }, 0);
      }
    }
  }, [isSocketConnected, fetchMessages]);

  useEffect(() => {
    if (blockUsers?.some((u) => u === user.userId)) {
      chDispatch({ type: "LEAVE_CHANNEL" });
    }
  }, [user.userId, blockUsers, chDispatch]);

  useEffect(() => {
    if (isSocketConnected && messages.length === 0) fetchMessages();
  }, [isSocketConnected, messages, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      if (!isScrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [messages]);

  return (
    <Stack justifyContent="flex-end" w="100%" h="100%" overflow="auto">
      {loading ? (
        <Spinner size="xl" w={20} h={20} alignSelf="center" margin="auto" />
      ) : (
        <Flex
          overflowY="auto"
          flexDir="column-reverse"
          ref={scrollRef}
          onScroll={handleScroll}
          px={2}
          gap={3}
          w="100%"
        >
          {messages &&
            messages.map((m) => {
              const chatUser =
                m.userId === GAME_MASTER._id
                  ? GAME_MASTER
                  : users.find((u) => u._id === m.userId);
              if (!chatUser) return null;

              return <DisplayMessage key={m._id} message={m} user={chatUser} />;
            })}
        </Flex>
      )}

      <Formik
        initialValues={{ newMessage: "" }}
        validationSchema={channelValidationSchema}
        onSubmit={handleSendMessage}
        validateOnBlur={false}
      >
        {(formik) => (
          <Form>
            <FormControl p={2} isRequired>
              <Field name="newMessage">
                {({ field }) => (
                  <Box position="relative" width="100%">
                    <Textarea
                      {...field}
                      variant="filled"
                      placeholder="Enter a message..."
                      resize="none"
                      pr="3rem"
                      overflowY="auto"
                      minHeight="42px"
                      maxHeight="300px"
                      as={TextareaAutosize}
                    />
                    <IconButton
                      aria-label="メッセージを送信"
                      icon={<BiSend />}
                      onClick={formik.handleSubmit}
                      position="absolute"
                      bottom={1}
                      right={2}
                      size="sm"
                      colorScheme="blue"
                      borderRadius="full"
                    />
                  </Box>
                )}
              </Field>
              <ErrorMessage
                name="newMessage"
                component="div"
                style={{ color: "red", fontSize: "smaller" }}
              />
            </FormControl>
          </Form>
        )}
      </Formik>
    </Stack>
  );
};

export default Channel;
