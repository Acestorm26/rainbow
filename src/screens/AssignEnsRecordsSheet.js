import { useRoute } from '@react-navigation/core';
import React from 'react';
import { Box, Heading, Stack, Text } from '@rainbow-me/design-system';

export default function AssignEnsRecordsSheet() {
  const { params } = useRoute();
  return (
    <Box background="body" flexGrow={1}>
      <Box flexGrow={1} paddingTop="30px">
        <Stack alignHorizontal="center" space="15px">
          <Heading size="26px" weight="heavy">
            {params?.ensName}.eth
          </Heading>
          <Text
            color={{ custom: 'rgba(152, 117, 215, 1)' }}
            size="16px"
            weight="heavy"
          >
            Create your profile
          </Text>
        </Stack>
      </Box>
    </Box>
  );
}
