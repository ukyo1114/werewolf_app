import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  List,
  ListItem,
  ListIcon,
  Collapse,
  Button,
  Link,
} from "@chakra-ui/react";
import {
  FaUserFriends,
  FaUserSecret,
  FaClock,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaChevronDown,
  FaChevronUp,
  FaHome,
} from "react-icons/fa";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

const HowToPlay = () => {
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const iconBg = useColorModeValue("blue.50", "blue.900");
  const headingColor = useColorModeValue("gray.700", "white");
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isOpen3, setIsOpen3] = useState(false);

  const steps = [
    {
      title: "1. アカウント作成またはゲストログイン",
      description:
        "新規の方はアカウントを作成、またはゲストとしてログインできます。",
      icon: FaUserFriends,
      content: (
        <VStack spacing={6} align="stretch" mt={4}>
          <Box>
            <Heading size="md" mb={4}>
              ゲストモードとメンバーの違い
            </Heading>
            <Text color={textColor} mb={4}>
              どちらのモードでも無料でプレイできます。メンバーになると、より多くの機能が利用可能になります。
            </Text>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>機能</Th>
                  <Th isNumeric>ゲスト</Th>
                  <Th isNumeric>メンバー</Th>
                </Tr>
              </Thead>
              <Tbody>
                {[
                  {
                    feature: "完全無料",
                    guest: true,
                    registered: true,
                  },
                  {
                    feature: "チャンネル作成",
                    guest: false,
                    registered: true,
                  },
                  {
                    feature: "ゲスト禁止チャンネルへの入室",
                    guest: false,
                    registered: true,
                  },
                ].map((type, index) => (
                  <Tr key={index}>
                    <Td>{type.feature}</Td>
                    <Td isNumeric>
                      {type.guest ? (
                        <Icon as={FaCheck} color="green.500" />
                      ) : (
                        <Icon as={FaTimes} color="red.500" />
                      )}
                    </Td>
                    <Td isNumeric>
                      {type.registered ? (
                        <Icon as={FaCheck} color="green.500" />
                      ) : (
                        <Icon as={FaTimes} color="red.500" />
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          <Box>
            <Heading size="md" mb={4}>
              アカウント作成の流れ
            </Heading>
            <List spacing={3}>
              {[
                "メールアドレスを入力して送信",
                "確認メールが届くまでお待ちください",
                "メール内のリンクをクリックしてアカウント作成ページへ",
                "パスワードとユーザー名を設定して完了",
              ].map((step, index) => (
                <ListItem key={index}>
                  <ListIcon as={FaInfoCircle} color="blue.500" />
                  {step}
                </ListItem>
              ))}
            </List>
            <Text mt={4} color={textColor}>
              ※ アカウント作成は完全無料です。課金要素は一切ありません。
            </Text>
          </Box>
        </VStack>
      ),
    },
    {
      title: "2. チャンネル入室",
      description: "チャンネルを作成したり、チャンネルを探したりできます。",
      icon: FaUserSecret,
      content: (
        <VStack spacing={6} align="stretch" mt={4}>
          <Box>
            <Heading size="md" mb={4}>
              チャンネル入室の流れ
            </Heading>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                チャンネル一覧から入室したいチャンネルを選択
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                チャンネルの詳細情報を確認（プレイヤー数、ルール設定など）
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                入室ボタンをクリック
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                パスワードが設定されている場合は入力が必要
              </ListItem>
            </List>
            <Text mt={4} color={textColor}>
              ※
              ゲストモードの場合は、ゲスト入室を許可しているチャンネルのみ入室可能です。
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={4}>
              チャンネル作成（メンバーのみ）
            </Heading>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                チャンネル名を設定
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                ゲストの入室を許可するか選択
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                チャンネルの説明を追加（任意）
              </ListItem>
            </List>
          </Box>
        </VStack>
      ),
    },
    {
      title: "3. ゲーム開始までの流れ",
      description: "チャンネルに入室したら、ゲーム開始までの準備をしましょう。",
      icon: FaClock,
      content: (
        <VStack spacing={6} align="stretch" mt={4}>
          <Box>
            <Heading size="md" mb={4}>
              エントリー手順
            </Heading>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                チャンネル内の「エントリー」ボタンをクリック
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                エントリーすると、プレイヤーリストに表示されます
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                現在のエントリー数が表示されているので、ゲーム開始まであと何人必要か確認できます
              </ListItem>
            </List>
          </Box>

          <Box>
            <Heading size="md" mb={4}>
              ゲーム開始
            </Heading>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                必要な人数が集まると自動的にゲームが開始されます
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                ゲーム開始まで待機中は、チャットで他のプレイヤーと会話できます
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                エントリーをキャンセルする場合は、再度エントリーボタンをクリックしてください
              </ListItem>
            </List>
          </Box>
        </VStack>
      ),
    },
  ];

  return (
    <Box bg={bgColor} minH="100vh" py={10}>
      <Container
        maxW="container.xl"
        position="relative"
        px={{ base: 4, md: 6 }}
      >
        <VStack spacing={10} align="stretch">
          <Box textAlign="center" mb={8} px={{ base: 4, md: 0 }}>
            <Heading
              as="h1"
              size={{ base: "xl", md: "2xl" }}
              mb={4}
              bgGradient="linear(to-r, blue.400, blue.600)"
              bgClip="text"
              wordBreak="keep-all"
              overflowWrap="break-word"
            >
              人狼ゲームのはじめかた
            </Heading>
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              color={textColor}
              maxW="2xl"
              mx="auto"
              px={{ base: 2, md: 0 }}
              wordBreak="keep-all"
              overflowWrap="break-word"
            >
              初めての方でも簡単に楽しめる人狼ゲームの遊び方をご紹介します
            </Text>
          </Box>

          <VStack spacing={8} align="stretch">
            {steps.map((step, index) => (
              <Box
                key={index}
                p={6}
                bg={cardBg}
                rounded="xl"
                shadow="md"
                _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                transition="all 0.3s"
                border="1px"
                borderColor={borderColor}
              >
                <Button
                  variant="ghost"
                  w="100%"
                  h="auto"
                  p={0}
                  onClick={() => {
                    if (index === 0) setIsOpen(!isOpen);
                    if (index === 1) setIsOpen2(!isOpen2);
                    if (index === 2) setIsOpen3(!isOpen3);
                  }}
                  _hover={{ bg: "transparent" }}
                >
                  <HStack spacing={4} w="100%" justify="space-between">
                    <HStack spacing={4}>
                      <Box p={3} rounded="lg" bg={iconBg} color="blue.500">
                        <Icon as={step.icon} w={6} h={6} />
                      </Box>
                      <VStack align="start" spacing={2}>
                        <Heading size="md" color={headingColor}>
                          {step.title}
                        </Heading>
                        <Text color={textColor}>{step.description}</Text>
                      </VStack>
                    </HStack>
                    {(index === 0 || index === 1 || index === 2) && (
                      <Icon
                        as={
                          index === 0
                            ? isOpen
                              ? FaChevronUp
                              : FaChevronDown
                            : index === 1
                              ? isOpen2
                                ? FaChevronUp
                                : FaChevronDown
                              : isOpen3
                                ? FaChevronUp
                                : FaChevronDown
                        }
                        color="blue.500"
                        transition="transform 0.2s"
                        transform={
                          (index === 0 && isOpen) ||
                          (index === 1 && isOpen2) ||
                          (index === 2 && isOpen3)
                            ? "rotate(180deg)"
                            : "rotate(0deg)"
                        }
                      />
                    )}
                  </HStack>
                </Button>
                {index === 0 && (
                  <Collapse in={isOpen} animateOpacity>
                    <Box
                      pt={6}
                      mt={6}
                      borderTop="1px"
                      borderColor={borderColor}
                    >
                      {step.content}
                    </Box>
                  </Collapse>
                )}
                {index === 1 && (
                  <Collapse in={isOpen2} animateOpacity>
                    <Box
                      pt={6}
                      mt={6}
                      borderTop="1px"
                      borderColor={borderColor}
                    >
                      {step.content}
                    </Box>
                  </Collapse>
                )}
                {index === 2 && (
                  <Collapse in={isOpen3} animateOpacity>
                    <Box
                      pt={6}
                      mt={6}
                      borderTop="1px"
                      borderColor={borderColor}
                    >
                      {step.content}
                    </Box>
                  </Collapse>
                )}
              </Box>
            ))}
          </VStack>

          <Box
            mt={8}
            p={6}
            bg={cardBg}
            rounded="xl"
            shadow="md"
            border="1px"
            borderColor={borderColor}
          >
            <Heading size="md" mb={6} color={headingColor}>
              基本的な役職
            </Heading>
            <VStack align="start" spacing={6}>
              <Box>
                <Heading size="sm" mb={3} color="blue.500">
                  村人陣営
                </Heading>
                <VStack align="start" spacing={3}>
                  <Text>
                    <Text as="span" fontWeight="bold" color="blue.500">
                      村人：
                    </Text>
                    人狼を見つけ出し、処刑するのが目的です。
                  </Text>
                  <Text>
                    <Text as="span" fontWeight="bold" color="purple.500">
                      占い師：
                    </Text>
                    夜の間に1人を選んで、その人が人狼かどうかを占うことができます。
                  </Text>
                  <Text>
                    <Text as="span" fontWeight="bold" color="green.500">
                      霊能者：
                    </Text>
                    処刑された人が人狼だったかどうかを知ることができます。
                  </Text>
                  <Text>
                    <Text as="span" fontWeight="bold" color="teal.500">
                      狩人：
                    </Text>
                    夜の間に1人を選んで、その人を人狼の襲撃から守ることができます。
                  </Text>
                </VStack>
              </Box>

              <Box>
                <Heading size="sm" mb={3} color="red.500">
                  人狼陣営
                </Heading>
                <VStack align="start" spacing={3}>
                  <Text>
                    <Text as="span" fontWeight="bold" color="red.500">
                      人狼：
                    </Text>
                    夜の間に村人を襲撃し、村人陣営の人数を減らすのが目的です。
                  </Text>
                  <Text>
                    <Text as="span" fontWeight="bold" color="orange.500">
                      狂人：
                    </Text>
                    村人陣営に属しますが、人狼の勝利を手助けするのが目的です。占い師や霊能者からは村人として判定されます。
                  </Text>
                </VStack>
              </Box>
            </VStack>

            <Box
              mt={8}
              p={4}
              bg={useColorModeValue("gray.50", "gray.700")}
              rounded="md"
            >
              <Text fontSize="sm" color={textColor} mb={2}>
                ※ その他にも以下の役職が実装されています：
              </Text>
              <VStack align="start" spacing={1} fontSize="sm" color={textColor}>
                <Text>
                  <Text as="span" fontWeight="bold" color="cyan.600">
                    共有者：
                  </Text>
                  村人陣営の役職で、他の共有者が誰かを知ることができ、夜には共有者同士で秘密会話ができます。
                </Text>
                <Text>
                  <Text as="span" fontWeight="bold" color="pink.500">
                    妖狐：
                  </Text>
                  第三陣営。人狼に襲撃されても死なず、最後まで生き残ることが目的です。
                </Text>
                <Text>
                  <Text as="span" fontWeight="bold" color="yellow.600">
                    狂信者：
                  </Text>
                  人狼陣営の役職で、人狼が誰かを知ることができますが、占い師からは村人と判定されます。
                </Text>
                <Text>
                  <Text as="span" fontWeight="bold" color="gray.600">
                    背徳者：
                  </Text>
                  妖狐陣営の役職で、妖狐の勝利をサポートします。霊能者からは村人と判定されます。
                </Text>
              </VStack>
            </Box>
          </Box>

          <Box mt={8} textAlign="center">
            <Link
              as={RouterLink}
              to="/"
              display="inline-flex"
              alignItems="center"
              color="blue.500"
              _hover={{ textDecoration: "underline", color: "blue.600" }}
              textDecoration="underline"
              transition="all 0.2s"
              fontSize={{ base: "sm", md: "md" }}
            >
              <Icon as={FaHome} mr={2} />
              <Text display={{ base: "none", sm: "inline" }}>
                トップページへ戻る
              </Text>
            </Link>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default HowToPlay;
