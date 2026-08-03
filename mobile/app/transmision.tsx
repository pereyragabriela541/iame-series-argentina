import { View } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Linking } from "react-native";

import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import { getAppConfig } from "@/lib/queries";
import { YOUTUBE_FALLBACK } from "@/lib/live-config";
import type { AppConfig } from "@/lib/types";

export default function TransmisionScreen() {
  const [url, setUrl] = useState(YOUTUBE_FALLBACK);

  useFocusEffect(
    useCallback(() => {
      void getAppConfig().then((config: AppConfig) => {
        const fromConfig = config.transmision?.url?.trim();
        if (fromConfig) setUrl(fromConfig);
      });
    }, []),
  );

  return (
    <Screen>
      <PageHeader
        kicker="Streaming"
        title="Transmisión en Vivo"
        subtitle="Seguí la transmisión oficial en YouTube"
      />
      <View style={{ marginTop: 8 }}>
        <PrimaryButton
          title="Ver transmisión en YouTube ↗"
          onPress={() => void Linking.openURL(url)}
        />
      </View>
    </Screen>
  );
}
