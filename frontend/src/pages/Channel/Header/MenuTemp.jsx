import { Menu, MenuButton, MenuList, IconButton } from "@chakra-ui/react";
import { FaBars } from "react-icons/fa";

const MenuTemp = ({ children }) => (
  <Menu>
    <MenuButton as={IconButton} icon={<FaBars />} variant="ghost" size="sm" />
    <MenuList>{children}</MenuList>
  </Menu>
);

export default MenuTemp;
