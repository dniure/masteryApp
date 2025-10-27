import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';

/**
 * Custom Tab Bar Component with Global Outline
 * 
 * Renders a custom tab bar with a single outline element that hovers
 * over the currently active tab.
 */
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [textCenters, setTextCenters] = React.useState<{ [key: number]: number }>({});
  const containerRef = React.useRef<View>(null);
  const textRefs = React.useRef<{ [key: number]: Text | null }>({});
  const outlineWidth = 64; // Fixed outline width
  
  // Measure text positions relative to container
  const measureTextPosition = (index: number) => {
    const textElement = textRefs.current[index];
    const container = containerRef.current;
    
    if (textElement && container) {
      textElement.measureLayout(
        container as any,
        (x, y, width, height) => {
          // Calculate the horizontal center of the text relative to container
          const textCenter = x + (width / 2);
          setTextCenters(prev => ({
            ...prev,
            [index]: textCenter,
          }));
        },
        () => {} // Error callback
      );
    }
  };
  
  // Get the horizontal center position of the active tab's text
  const activeTextCenter = textCenters[state.index] || 0;
  const outlineLeft = activeTextCenter - (outlineWidth / 1.75);
  
  return (
    <View style={styles.tabBarContainer} ref={containerRef}>
      {/* Global outline that hovers over active tab, centered on text */}
      {textCenters[state.index] !== undefined && (
        <View 
          style={[
            styles.globalOutline,
            {
              left: outlineLeft,
            }
          ]}
        />
      )}
      
      {/* Tab buttons - equally spaced icon-text pairs */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tabButton}
          >
            {/* Icon-Text pair wrapped as a single layer */}
            <View style={styles.iconTextLayer}>
              {options.tabBarIcon?.({ focused: isFocused, color: '', size: 24 })}
              {options.title && (
                <Text 
                  ref={(ref) => {
                    textRefs.current[index] = ref;
                  }}
                  style={[
                    styles.labelText,
                    { opacity: isFocused ? 1 : 0.6 }
                  ]}
                  onLayout={() => {
                    // Measure text position relative to container
                    measureTextPosition(index);
                  }}
                >
                  {options.title}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * TabLayout Component
 * 
 * Defines the bottom tab navigation structure for the app with five main screens:
 * Tracker, Tasks, Journal, Goals, and Profile.
 * 
 * Features:
 * - Custom floating tab bar with rounded corners and shadow
 * - PNG icon assets from assets/images/icons/
 * - Global outline element that moves over active tab
 * - Haptic feedback on tab press
 * - Responsive styling with platform-specific adjustments
 */
export default function TabLayout() {
  return (
    <Tabs
      // Set tracker as the initial screen when app launches
      initialRouteName="tracker"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        
        // Hide the header bar at the top of each screen
        headerShown: false,
        
        // Use custom haptic feedback button component
        tabBarButton: HapticTab,
      }}>
      
      {/* Tracker Tab - Main screen for tracking routines and habits */}
      <Tabs.Screen
        name="tracker"
        options={{
          title: 'Tracker',
          tabBarIcon: ({ focused }) => (
            <Image 
              source={require('@/assets/images/icons/tracker.png')} 
              style={{ 
                width: 37, 
                height: 37, 
                opacity: focused ? 1 : 0.6,
                marginBottom: -5,  // Adjust this to fine-tune icon-text spacing
              }} 
            />
          ),
        }}
      />
      
      {/* Tasks Tab - Task management and to-do lists */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused }) => (
            <Image 
              source={require('@/assets/images/icons/tasks.png')} 
              style={{ 
                width: 42, 
                height: 42, 
                opacity: focused ? 1 : 0.6,
                marginBottom: -6,  // Adjust this to fine-tune icon-text spacing
              }} 
            />
          ),
        }}
      />
      
      {/* Journal Tab - Daily journaling and notes */}
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ focused }) => (
            <Image 
              source={require('@/assets/images/icons/journal.png')} 
              style={{ 
                width: 30, 
                height: 30, 
                opacity: focused ? 1 : 0.6,
                marginBottom: -1,  // Adjust this to fine-tune icon-text spacing
              }} 
            />
          ),
        }}
      />
      
      {/* Goals Tab - Long-term goal setting and tracking */}
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ focused }) => (
            <Image 
              source={require('@/assets/images/icons/goals.png')} 
              style={{ 
                width: 29, 
                height: 29, 
                opacity: focused ? 1 : 0.6,
                marginBottom: 1,  // Adjust this to fine-tune icon-text spacing
              }} 
            />
          ),
        }}
      />
      
      {/* Profile Tab - User settings and profile information */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Image 
              source={require('@/assets/images/icons/profile.png')} 
              style={{ 
                width: 32, 
                height: 32, 
                opacity: focused ? 1 : 0.6,
                marginBottom: -3,  // Adjust this to fine-tune icon-text spacing
              }} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

/**
 * Styles for Custom Tab Bar
 */
const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    width: '90%',
    paddingHorizontal: 0,
    height: 64,                        
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',    // Equally space the icon-text pairs
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 10.2,
  },
  globalOutline: {
    position: 'absolute',
    bottom: 6,
    top: 6,
    width: 72,
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    zIndex: 10,                        // Ensure outline appears above tabs
  },
  tabButton: {
    justifyContent: 'flex-end',        // Align to bottom so all text is on same baseline
    alignItems: 'center',
    paddingBottom: 6,                  // Fixed padding from bottom
    zIndex: 1,                         // Below the outline
  },
  iconTextLayer: {
    alignItems: 'center',              // Center icon and text within the layer
    justifyContent: 'flex-end',        // Align to bottom (text at bottom)
  },
  labelText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#000000',
  },
});
