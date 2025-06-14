import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Text,
  ImageBackground,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

function timeStringToMinutes(timeStr: string): number {
  const [time, modifier] = timeStr.split(/(AM|PM)/);
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function isTimeInRange(current: number, start: number, end: number): boolean {
  return start < end
    ? current >= start && current < end
    : current >= start || current < end;
}

const TIME_SEGMENTS = [
  {
    name: 'fajr',
    start: timeStringToMinutes('6:15AM'),
    end: timeStringToMinutes('1:30PM'),
    colors: ['#FF7709', '#623007'],
  },
  {
    name: 'zhur',
    start: timeStringToMinutes('1:30PM'),
    end: timeStringToMinutes('6:30PM'),
    colors: ['#2197D6', '#4592BC', '#6D8E9F'],
  },
  {
    name: 'asr',
    start: timeStringToMinutes('6:30PM'),
    end: timeStringToMinutes('8:00PM'),
    colors: ['#4F709C', '#7D8FA3'],
  },
  {
    name: 'magrib',
    start: timeStringToMinutes('8:00PM'),
    end: timeStringToMinutes('8:30PM'),
    colors: ['#1253AF', '#896232'],
  },
  {
    name: 'isha',
    start: timeStringToMinutes('8:30PM'),
    end: timeStringToMinutes('6:15AM'),
    colors: ['#0E1F58', '#191818'],
  },
];

function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getCurrentTimeSegmentIndex() {
  const now = getCurrentMinutes();
  for (let i = 0; i < TIME_SEGMENTS.length; i++) {
    const { start, end } = TIME_SEGMENTS[i];
    if (isTimeInRange(now, start, end)) return i;
  }
  return 0;
}

function getRotatedSegments() {
  const index = getCurrentTimeSegmentIndex();
  return [...TIME_SEGMENTS.slice(index), ...TIME_SEGMENTS.slice(0, index)];
}

export default function TabOneScreen() {
  const [colors, setColors] = useState<string[]>([]);
  const animation = useRef(new Animated.Value(0)).current;
  const gradientRef = useRef<{ from: string[]; to: string[] } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const scrollToCurrentSegment = () => {
    const index = getCurrentTimeSegmentIndex();
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  useEffect(() => {
    const updateGradients = () => {
      const nowIndex = getCurrentTimeSegmentIndex();
      const from = TIME_SEGMENTS[nowIndex].colors;
      const to = TIME_SEGMENTS[(nowIndex + 1) % TIME_SEGMENTS.length].colors;

      gradientRef.current = { from, to };
      animation.setValue(0);

      Animated.timing(animation, {
        toValue: 1,
        duration: 60000 * 60, // 1 hour
        useNativeDriver: false,
      }).start();

      scrollToCurrentSegment(); // auto-scroll to top
    };

    updateGradients();
    const interval = setInterval(updateGradients, 1000 * 60 * 10); // every 10 min

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const listener = animation.addListener(({ value }) => {
      if (gradientRef.current) {
        const blended = interpolateColors(gradientRef.current.from, gradientRef.current.to, value);
        setColors(blended);
      }
    });

    return () => {
      animation.removeListener(listener);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={colors.length > 0 ? colors : ['#000', '#000']} style={styles.gradient} />

      <ImageBackground
        source={require('../../assets/images/Masjid-Silhouette.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <FlatList
        ref={flatListRef}
        data={TIME_SEGMENTS}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={({ item, index }) => (
          <View style={[styles.item, { opacity: 1 - index * 0.15 }]}>
            <Text style={styles.text}>{item.name.toUpperCase()}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: height / 6,
          offset: (height / 6) * index,
          index,
        })}
      />
    </SafeAreaView>
  );
}


function interpolateColors(from: string[], to: string[], progress: number): string[] {
  const hexToRgb = (hex: string) => {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    return [bigint >> 16 & 255, bigint >> 8 & 255, bigint & 255];
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return (
      '#' +
      [r, g, b]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('')
    );
  };

  return from.map((startColor, index) => {
    const startRGB = hexToRgb(startColor);
    const endRGB = hexToRgb(to[index] || startColor);
    const r = Math.round(startRGB[0] + (endRGB[0] - startRGB[0]) * progress);
    const g = Math.round(startRGB[1] + (endRGB[1] - startRGB[1]) * progress);
    const b = Math.round(startRGB[2] + (endRGB[2] - startRGB[2]) * progress);
    return rgbToHex(r, g, b);
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  item: {
    height: height / 6,
    justifyContent: 'center',
    marginLeft:30
  },
  text: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
});
