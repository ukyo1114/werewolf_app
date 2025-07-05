import { Flex, Text, Divider, Button } from "@chakra-ui/react";
import { useUserState } from "../context/UserProvider";

export const DisplayDay = ({ day }) => (
  <Text textAlign="center" fontWeight="bold" fontSize="lg">
    {day}日目
  </Text>
);

export const StyledText = ({ children, ...props }) => (
  <Text fontSize="lg" textAlign="center" {...props}>
    {children}
  </Text>
);

export const DisplayRole = ({ children, status }) => (
  <Text
    fontSize="md"
    fontWeight="bold"
    textAlign="center"
    bg={status === "alive" ? "green.100" : "purple.100"}
    borderRadius="lg"
    px={3}
    py={1}
  >
    {children}
  </Text>
);

export const DisplayPhase = ({ children, ...props }) => (
  <Text fontSize="lg" display="flex" alignItems="center" {...props}>
    {children}
  </Text>
);

export const SidebarButton = ({ label, children, ...props }) => (
  <Button
    colorScheme="blue"
    variant={{ base: "ghost", lg: "outline" }}
    borderWidth={{ lg: "1px" }}
    boxShadow={{ lg: "md" }}
    bg={{ lg: "rgba(255,255,255,0.3)" }}
    backdropFilter={{ lg: "blur(1px)" }}
    _hover={{
      transform: "translateY(-2px)",
      boxShadow: "lg",
    }}
    w="100%"
    justifyContent={{ base: "center", lg: "flex-start" }}
    iconSpacing={0}
    {...props}
  >
    {children}
    <Text display={{ base: "none", lg: "flex" }} ml={2}>
      {label}
    </Text>
  </Button>
);

export const CustomButton = ({ children, ...props }) => (
  <Button
    {...props}
    colorScheme="blue"
    variant="outline"
    borderWidth="1px"
    size="lg"
    boxShadow="md"
    bg="rgba(255,255,255,0.3)"
    backdropFilter="blur(8px)"
    _hover={{
      transform: "translateY(-2px)",
      boxShadow: "lg",
    }}
    flexShrink={0}
  >
    {children}
  </Button>
);

export const SelectableBox = ({ children, ...props }) => (
  <Flex
    alignItems="center"
    p={4}
    borderRadius="lg"
    cursor="pointer"
    boxShadow="md"
    _hover={{
      transform: "translateY(-2px)",
      boxShadow: "lg",
    }}
    {...props}
  >
    {children}
  </Flex>
);

export const EllipsisText = ({ children, ...props }) => (
  <Text
    whiteSpace="nowrap"
    overflow="hidden"
    textOverflow="ellipsis"
    {...props}
  >
    {children}
  </Text>
);

export const iconProps = {
  size: "28px",
};

export const formProps = {
  borderColor: "gray.500",
  borderWidth: "2px",
  bg: "whiteAlpha.900",
};

export const shadowProps = {
  boxShadow:
    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 0 20px rgba(0, 0, 0, 0.3)",
};
