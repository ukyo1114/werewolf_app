import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
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
  const roleBoxBg = useColorModeValue("gray.50", "gray.700");
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isOpen3, setIsOpen3] = useState(false);

  const getRoleColor = (role) => {
    const roleColors = {
      村人: "blue.500",
      占い師: "purple.500",
      霊能者: "green.500",
      狩人: "teal.500",
      共有者: "cyan.500",
      人狼: "red.500",
      狂人: "orange.500",
      妖狐: "pink.500",
      背徳者: "gray.500",
    };
    return roleColors[role] || "gray.500";
  };

  const steps = [
    {
      title: "1. ログイン",
      description: "ゲストログインまたはアカウント登録でログインします。",
      icon: FaUserFriends,
      content: (
        <VStack spacing={6} align="stretch" mt={4}>
          <Box>
            <Heading size="md" mb={4}>
              ゲストユーザーとして参加
            </Heading>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                ゲストログインを選択
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                ユーザー名を入力（最大20文字）
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                すぐにゲームに参加可能
              </ListItem>
            </List>
            <Text mt={4} color={textColor} fontWeight="bold">
              ゲストユーザーの制限:
            </Text>
            <List spacing={2} mt={2}>
              <ListItem>
                <ListIcon as={FaTimes} color="red.500" />
                チャンネル作成は不可
              </ListItem>
              <ListItem>
                <ListIcon as={FaTimes} color="red.500" />
                ゲーム統計の記録はされない
              </ListItem>
            </List>
          </Box>

          <Box>
            <Heading size="md" mb={4}>
              アカウント登録
            </Heading>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                新規登録を選択
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                ユーザー名、メールアドレス、パスワードを入力
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                メール認証（必要に応じて）
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                ログイン完了
              </ListItem>
            </List>
            <Text mt={4} color={textColor} fontWeight="bold">
              登録ユーザーの特典:
            </Text>
            <List spacing={2} mt={2}>
              <ListItem>
                <ListIcon as={FaCheck} color="green.500" />
                チャンネル作成・管理が可能
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheck} color="green.500" />
                プロフィール画像の設定
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheck} color="green.500" />
                ゲーム統計の記録・確認
              </ListItem>
              <ListItem>
                <ListIcon as={FaCheck} color="green.500" />
                より多くの機能にアクセス可能
              </ListItem>
            </List>
          </Box>
        </VStack>
      ),
    },
    {
      title: "2. チャンネル選択",
      description: "チャンネル一覧から参加したいチャンネルを選択します。",
      icon: FaUserSecret,
      content: (
        <VStack spacing={6} align="stretch" mt={4}>
          <Box>
            <Heading size="md" mb={4}>
              チャンネル一覧の確認
            </Heading>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                メイン画面でチャンネル一覧を確認
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                参加可能なチャンネルを選択
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                パスワードが必要な場合は入力
              </ListItem>
            </List>
          </Box>

          <Box>
            <Heading size="md" mb={4}>
              チャンネル作成（登録ユーザーのみ）
            </Heading>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                チャンネル作成ボタンをクリック
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                チャンネル名（最大50文字）を設定
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                説明（最大2000文字）を追加
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                プレイヤー数（5〜20人）を設定
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                パスワード設定（任意）
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                ゲスト参加の許可/拒否を選択
              </ListItem>
            </List>
          </Box>
        </VStack>
      ),
    },
    {
      title: "3. エントリー",
      description: "チャンネル内でエントリーボタンを押してゲームに参加します。",
      icon: FaClock,
      content: (
        <VStack spacing={6} align="stretch" mt={4}>
          <Box>
            <Heading size="md" mb={4}>
              エントリー機能
            </Heading>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                エントリーボタン：チャンネル内でゲームに参加するために押すボタン
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                自動開始：設定されたプレイヤー数に達すると自動的にゲームが開始される
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                エントリー解除：ゲーム開始前であればエントリーを解除可能
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                待機状態：エントリー後、他のプレイヤーの参加を待機
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
                役職が配布される
              </ListItem>
              <ListItem>
                <ListIcon as={FaInfoCircle} color="blue.500" />
                人狼ゲームが開始される
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
              あそびかた
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
              プレイ人数ごとの配役
            </Heading>
            <VStack align="stretch" spacing={4}>
              {[
                {
                  players: 5,
                  roles: ["村人", "村人", "村人", "人狼", "占い師"],
                },
                {
                  players: 6,
                  roles: ["村人", "村人", "村人", "村人", "人狼", "占い師"],
                },
                {
                  players: 7,
                  roles: [
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "人狼",
                    "占い師",
                    "狂人",
                  ],
                },
                {
                  players: 8,
                  roles: [
                    "村人",
                    "人狼",
                    "人狼",
                    "占い師",
                    "狂人",
                    "狩人",
                    "共有者",
                    "共有者",
                  ],
                },
                {
                  players: 9,
                  roles: [
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "人狼",
                    "占い師",
                    "妖狐",
                    "背徳者",
                    "背徳者",
                  ],
                },
                {
                  players: 10,
                  roles: [
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "人狼",
                    "人狼",
                    "占い師",
                    "霊能者",
                    "狂人",
                    "狩人",
                  ],
                },
                {
                  players: 11,
                  roles: [
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "人狼",
                    "人狼",
                    "占い師",
                    "霊能者",
                    "狂人",
                    "狩人",
                  ],
                },
                {
                  players: 12,
                  roles: [
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "人狼",
                    "人狼",
                    "占い師",
                    "霊能者",
                    "狂人",
                    "狩人",
                    "妖狐",
                  ],
                },
                {
                  players: 13,
                  roles: [
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "人狼",
                    "人狼",
                    "占い師",
                    "霊能者",
                    "狂人",
                    "狩人",
                    "妖狐",
                    "背徳者",
                  ],
                },
                {
                  players: 14,
                  roles: [
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "占い師",
                    "霊能者",
                    "狩人",
                    "人狼",
                    "人狼",
                    "人狼",
                    "共有者",
                    "共有者",
                  ],
                },
                {
                  players: 15,
                  roles: [
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "人狼",
                    "人狼",
                    "人狼",
                    "占い師",
                    "霊能者",
                    "狂人",
                    "狩人",
                    "共有者",
                    "共有者",
                    "妖狐",
                    "背徳者",
                  ],
                },
                {
                  players: 16,
                  roles: [
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "人狼",
                    "人狼",
                    "人狼",
                    "占い師",
                    "霊能者",
                    "狂人",
                    "狩人",
                    "共有者",
                    "共有者",
                    "妖狐",
                  ],
                },
                {
                  players: 17,
                  roles: [
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "村人",
                    "人狼",
                    "人狼",
                    "人狼",
                    "占い師",
                    "霊能者",
                    "狂人",
                    "狩人",
                    "共有者",
                    "共有者",
                    "妖狐",
                  ],
                },
              ].map((config, index) => (
                <Box key={index} p={4} bg={roleBoxBg} rounded="md">
                  <HStack justify="space-between" mb={3}>
                    <Heading size="sm" color={headingColor}>
                      {config.players}人ゲーム
                    </Heading>
                    <Text fontSize="sm" color={textColor}>
                      {config.roles.length}役職
                    </Text>
                  </HStack>
                  <HStack wrap="wrap" spacing={2}>
                    {config.roles.map((role, roleIndex) => (
                      <Box
                        key={roleIndex}
                        px={3}
                        py={1}
                        bg={getRoleColor(role)}
                        color="white"
                        rounded="full"
                        fontSize="sm"
                        fontWeight="bold"
                      >
                        {role}
                      </Box>
                    ))}
                  </HStack>
                </Box>
              ))}
            </VStack>
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
