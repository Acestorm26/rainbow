import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import { View, ViewProps } from 'react-native';
import styled from 'styled-components';
import { withThemeContext } from '../../context/ThemeContext';
import { deviceUtils } from '../../utils';
import { ShimmerAnimation } from '../animations';
import { CoinRowHeight } from '../coin-row';
import { Row } from '../layout';
import { position } from '@rainbow-me/styles';

export const AssetListItemSkeletonHeight = CoinRowHeight;

export const FakeAvatar = styled(View)`
  ${position.size(40)};
  background-color: ${({ theme: { colors } }) => colors.skeleton};
  border-radius: 20;
`;

export const FakeRow = styled(Row).attrs({
  align: 'flex-end',
  flex: 0,
  height: 10,
  justify: 'space-between',
  paddingBottom: 5,
  paddingTop: 5,
})(Row);

export const FakeText = styled(View).attrs(
  ({ height = 10 }: { height: number }) => ({
    height,
  })
)`
  background-color: ${({ theme: { colors } }) => colors.skeleton};
  border-radius: ${({ height }: { height: number }) => height / 2};
  height: ${({ height }: { height: number }) => height};
`;

const Wrapper = styled(View)`
  ${position.size('100%')};
`;

const ShimmerWrapper = styled(Wrapper)`
  background-color: ${({ theme: { colors } }) => colors.skeleton};
`;

function Skeleton({
  animated = true,
  children,
  style,
  colors,
  width = deviceUtils.dimensions.width,
}: {
  animated?: boolean;
  children: React.ReactElement;
  style: ViewProps['style'];
  colors: any;
  width?: number;
}) {
  if (animated) {
    return (
      <MaskedView
        maskElement={<Wrapper style={style}>{children}</Wrapper>}
        style={{ flex: 1 }}
      >
        <ShimmerWrapper>
          <ShimmerAnimation
            color={colors.shimmer}
            enabled
            gradientColor={colors.shimmer}
            width={width}
          />
        </ShimmerWrapper>
      </MaskedView>
    );
  }
  return (
    <View
      style={[
        {
          flex: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default withThemeContext(Skeleton);