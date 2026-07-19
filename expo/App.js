import React from 'react';
import { SafeAreaView, StatusBar, ActivityIndicator, View, Text, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';

// URL dell'app web "Insieme" (GitHub Pages).
// La pagina deve essere ONLINE perché Expo Go la possa caricare.
const APP_URL = 'https://francimanci.github.io/indovina/';

export default function App() {
  const dark = useColorScheme() === 'dark';
  const bg = dark ? '#000000' : '#ffffff';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <WebView
        source={{ uri: APP_URL }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        startInLoadingState
        pullToRefreshEnabled
        setSupportMultipleWindows={false}
        renderLoading={() => (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
            <ActivityIndicator size="large" color={dark ? '#fff' : '#000'} />
          </View>
        )}
        renderError={() => (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: bg }}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📡</Text>
            <Text style={{ color: dark ? '#fff' : '#000', fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
              Pagina non raggiungibile
            </Text>
            <Text style={{ color: dark ? '#aaa' : '#666', textAlign: 'center' }}>
              Assicurati che l'app sia pubblicata online (GitHub Pages) e riprova.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
