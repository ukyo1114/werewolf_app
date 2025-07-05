import { Checkbox } from "@chakra-ui/react";
import { EllipsisText } from "../miscellaneous/CustomComponents.jsx";

const ChannelListHeader = ({ showJoinedCh, setShowJoinedCh }) => (
  <>
    <EllipsisText fontSize="lg" fontWeight="bold" color="gray.700">
      チャンネルリスト
    </EllipsisText>

    <Checkbox
      id="isJoined"
      isChecked={showJoinedCh}
      onChange={(e) => setShowJoinedCh(e.target.checked)}
    >
      <EllipsisText>参加中のみ</EllipsisText>
    </Checkbox>
  </>
);

export default ChannelListHeader;