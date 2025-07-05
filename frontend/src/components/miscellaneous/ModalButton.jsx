import { Button } from "@chakra-ui/react";

const ModalButton = ({ 
  children,
  colorScheme="teal",
  onClick, isDisabled, type, isLoading, ...props
}) => {
  return (
    <Button
      flex="none"
      width="100%"
      colorScheme={colorScheme}
      onClick={onClick}
      isDisabled={isDisabled}
      type={type}
      isLoading={isLoading}
      {...props}
    >
      {children}
    </Button>
  )
};

export default ModalButton;