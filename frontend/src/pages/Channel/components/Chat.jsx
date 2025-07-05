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

import { useUserState } from "../../../context/UserProvider.jsx";
import useChatMessages from "../hooks/useChatMessages";
import useChatSocket from "../hooks/useChatSocket";
import { channelValidationSchema } from "../../../components/channel/validationSchema";
import DisplayMessage from "./DisplayMessage.jsx";
import { GAME_MASTER } from "../../../constants";
import messagesReducer from "../../../reducers/messageReducer";
import ChannelSidebar from "./ChannelSidebar/ChannelSidebar.jsx";
import GameSidebar from "./GameSidebar/GameSidebar.jsx";

const Chat = () => {
  const [messages, mDispatch] = useReducer(messagesReducer, []);
  const { user, currentChannel, chDispatch, isMobile } = useUserState();
  const scrollRef = useRef(null);
  const isScrollRef = useRef(null);
  const messagesCompletedRef = useRef(null);

  const { users, blockUsers, isGame } = currentChannel;

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
    <Flex w="100%" h="100%" gap={4} overflow="hidden">
      {!isMobile && (
        <Box flexShrink={0} h="100%" overflow="auto">
          {isGame ? <GameSidebar /> : <ChannelSidebar />}
        </Box>
      )}
      <Stack
        justifyContent="flex-end"
        w="100%"
        h="100%"
        flex={1}
        overflow="hidden"
        bg="rgba(255,255,255,0.5)"
        backdropFilter="blur(4px)"
        borderRadius="lg"
      >
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
            flex={1}
            minH={0}
          >
            {messages &&
              messages.map((m) => {
                const chatUser =
                  m.userId === GAME_MASTER._id
                    ? GAME_MASTER
                    : users.find((u) => u._id === m.userId);
                if (!chatUser) return null;

                return (
                  <DisplayMessage key={m._id} message={m} user={chatUser} />
                );
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
    </Flex>
  );
};

export default Chat;
