import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

/**
 * ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================
 */

/** Represents a todo item with importance flag and completion status */
interface TodoItem {
  id: number;
  text: string;
  important: boolean;
  status: TodoStatus;
}

/** Status levels for todo items: 0=none, 1=urgent, 2=in-progress, 3=complete */
type TodoStatus = 0 | 1 | 2 | 3;

/** Activity entry with optional duration */
interface ActivityEntry {
  activity: string;
  duration?: string;
}

/** Activity log item props */
interface ActivityItemProps {
  time: string;
  activity: string;
  duration?: string;
  isLast?: boolean;
  onActivityChange: (time: string, newActivity: string) => void;
}

/** Activity log section props */
interface ActivityLogSectionProps {
  timeSlots: string[];
  onOverflowChange: (hasOverflow: boolean) => void;
  onAtBottomChange: (isAtBottom: boolean) => void;
}

/** Diet row type */
type DietRowType = 'time' | 'separator' | 'break';

/** Diet entry row in table */
interface DietEntry {
  id: number;
  leftColumn: string; // Can be time (08:30), '|', or '...'
  rightColumn: string; // Editable data field
  type: DietRowType; // Determines behavior
}

/**
 * ============================================================================
 * CONSTANTS
 * ============================================================================
 */

/** Time configuration */
const TIME_CONFIG = {
  START_HOUR: 6,
  SLOT_INTERVAL_MINUTES: 30,
  TOTAL_SLOTS: 48,
} as const;

/** Color scheme for todo status indicators */
const TODO_STATUS_COLORS: Record<TodoStatus, string> = {
  0: 'transparent',
  1: '#FF3B30',    // Red - urgent
  2: '#FF9500',    // Amber - in progress
  3: '#34C759',    // Green - complete
} as const;

/** Visual indicators for todo items */
const TODO_INDICATORS = {
  IMPORTANT: '!!    ',
  NORMAL: '-',
} as const;

/** Color palette */
const COLORS = {
  PRIMARY_RED: '#C4463A',
  GRAY_LIGHT: '#8F8F8F',
  GRAY_DARK: '#5A5A5A',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  BACKGROUND: '#F0F0F0',
} as const;

/** Sample activities mapped to time slots */
const ACTIVITY_DATA: Record<string, ActivityEntry> = {
  '06:00': { activity: 'Sleep' },
  '06:30': { activity: 'Wake Up > Morning Routine' },
  '07:00': { activity: 'Shower > Grounding > Surya Namaskar' },
  '07:30': { activity: 'Pranayama > 10 Min Meditation' },
  '08:00': { activity: 'Making Coffee > On Phone > This' },
  '08:30': { activity: 'Demo recording a vid', duration: '15' },
  '09:00': { activity: 'Demo recording a vid', duration: '28' },
  '09:30': { activity: 'Reading goals > Job Application', duration: '20' },
  '10:00': { activity: 'Finishing > On Phone > In Garden' },
  '10:30': { activity: 'In Garden > Making Tea | On Phone' },
  '11:00': { activity: 'Designing App UI', duration: '20' },
  '11:30': { activity: 'Designing App UI', duration: '30' },
  '12:00': { activity: 'Designing App UI' },
} as const;

/** Initial diet log data */
const INITIAL_DIET_DATA: DietEntry[] = [
  { id: 1, leftColumn: '08:20', rightColumn: 'Black Coffee (no sugar)', type: 'time' },
  { id: 2, leftColumn: '|', rightColumn: '1 Scoop Creatine', type: 'separator' },
  { id: 3, leftColumn: '13:15', rightColumn: 'Rice + Dal', type: 'time' },
  { id: 4, leftColumn: '|', rightColumn: '1 glass orange juice', type: 'separator' },
  { id: 5, leftColumn: '|', rightColumn: 'turkish delight sweet', type: 'separator' },
  { id: 6, leftColumn: '|', rightColumn: '1 set roti', type: 'separator' },
  { id: 7, leftColumn: '|', rightColumn: '2 tbsp kurauni', type: 'separator' },
  { id: 8, leftColumn: '...', rightColumn: '', type: 'break' },
  { id: 9, leftColumn: '|', rightColumn: 'Chicken Curry', type: 'separator' },
  { id: 10, leftColumn: '|', rightColumn: '1 Roti', type: 'separator' },
  { id: 11, leftColumn: '|', rightColumn: '1 glass orange juice', type: 'separator' },
  { id: 12, leftColumn: '21:00', rightColumn: '', type: 'time' },
];

/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 */

/**
 * Generates time slots for the day at 30-minute intervals
 * @returns Array of time strings in HH:MM format
 */
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const { START_HOUR, SLOT_INTERVAL_MINUTES, TOTAL_SLOTS } = TIME_CONFIG;
  
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const totalMinutes = (START_HOUR * 60 + i * SLOT_INTERVAL_MINUTES) % (24 * 60);
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    slots.push(timeString);
  }
  
  return slots;
}

/**
 * ============================================================================
 * COMPONENTS
 * ============================================================================
 */

/**
 * CalendarSection Component
 * 
 * Displays a horizontal date selector with navigation arrows and
 * highlights the current active day.
 */
function CalendarSection(): React.JSX.Element {
  const ICON_SIZE = 13;
  
  return (
    <View style={styles.calendarContainer}>
      <TouchableOpacity 
        style={styles.calendarArrowButton}
        accessibilityLabel="Previous day"
      >
        <IconSymbol 
          size={ICON_SIZE} 
          name="chevron.left" 
          color={COLORS.GRAY_LIGHT} 
        />
      </TouchableOpacity>
      
      <View style={styles.calendarDatesContainer}>
        <View style={styles.calendarDateItem}>
          <Text style={styles.calendarDayLabel}>Mon</Text>
          <Text style={styles.calendarDateNumber}>22</Text>
        </View>
        
        <View style={styles.calendarDateItem}>
          <Text style={styles.calendarDayLabel}>Tue</Text>
          <Text style={styles.calendarDateNumber}>23</Text>
        </View>
        
        <View style={[styles.calendarDateItem, styles.calendarDateItemActive]}>
          <Text style={styles.calendarDayLabelActive}>Wednesday</Text>
          <Text style={styles.calendarDateSubtext}>24th September 2025</Text>
        </View>
        
        <View style={styles.calendarDateItem}>
          <Text style={styles.calendarDayLabel}>Thu</Text>
          <Text style={styles.calendarDateNumber}>25</Text>
        </View>
        
        <View style={styles.calendarDateItem}>
          <Text style={styles.calendarDayLabel}>Fri</Text>
          <Text style={styles.calendarDateNumber}>26</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.calendarArrowButton}
        accessibilityLabel="Next day"
      >
        <IconSymbol 
          size={ICON_SIZE} 
          name="chevron.right" 
          color={COLORS.GRAY_LIGHT} 
        />
      </TouchableOpacity>
    </View>
  );
}

/**
 * TodoSection Component
 * 
 * Displays a list of todo items with importance indicators and status circles.
 * Important todos are highlighted with a red ribbon background.
 * Status can be cycled through by tapping the status circle.
 */
function TodoSection(): React.JSX.Element {
  const [todos, setTodos] = useState<TodoItem[]>([
    { 
      id: 1, 
      text: 'Finish app prototype', 
      important: true, 
      status: 0 
    },
    { 
      id: 2, 
      text: 'Finish Designing Thumbnails', 
      important: false, 
      status: 0 
    },
    { 
      id: 3, 
      text: 'Plan coding part', 
      important: false, 
      status: 0 
    },
  ]);
  
  /**
   * Cycles the todo status through available states (0 -> 1 -> 2 -> 3 -> 0)
   * @param todoId - The ID of the todo to update
   */
  const handleStatusUpdate = (todoId: number): void => {
    setTodos(previousTodos =>
      previousTodos.map(todo =>
        todo.id === todoId
          ? { ...todo, status: ((todo.status + 1) % 4) as TodoStatus }
          : todo
      )
    );
  };
  
  /**
   * Renders a single todo item with appropriate styling based on importance
   */
  const renderTodoItem = (todo: TodoItem): React.JSX.Element => {
    const containerStyle = todo.important 
      ? styles.todoItemContainerImportant 
      : styles.todoItemContainerNormal;
    
    const prefixText = todo.important 
      ? TODO_INDICATORS.IMPORTANT 
      : TODO_INDICATORS.NORMAL;
    
    const prefixColor = todo.important 
      ? COLORS.WHITE 
      : COLORS.BLACK;
    
    return (
      <View key={todo.id} style={containerStyle}>
        {/* Red ribbon background for important items */}
        {todo.important && <View style={styles.todoImportanceRibbon} />}
        
        {/* Prefix column (!! or -) */}
        <View style={styles.todoPrefixColumn}>
          <Text style={[styles.todoPrefixText, { color: prefixColor }]}>
            {prefixText}
          </Text>
        </View>
        
        {/* Task text */}
        <Text style={styles.todoTaskText}>{todo.text}</Text>
        
        {/* Status indicator circle */}
        <TouchableOpacity
          style={[
            styles.todoStatusCircle,
            { backgroundColor: TODO_STATUS_COLORS[todo.status] }
          ]}
          onPress={() => handleStatusUpdate(todo.id)}
          accessibilityLabel={`Update status for ${todo.text}`}
          accessibilityRole="button"
        />
      </View>
    );
  };
  
  return (
    <View style={styles.toDo}>
      <Text style={styles.toDoTitle}>To-do:</Text>
      {todos.map(renderTodoItem)}
    </View>
  );
}

/**
 * ActivityLogSection Component
 * 
 * Displays a scrollable log of activities throughout the day with category tags.
 * Shows time slots and associated activities with optional durations.
 */
function ActivityLogSection({ timeSlots, onOverflowChange, onAtBottomChange }: ActivityLogSectionProps): React.JSX.Element {
  const CATEGORY_TAGS = [
    { label: 'Diving', color: '#FFD60A' },
    { label: 'JobSearch', color: '#BF5AF2' },
    { label: 'YouTube', color: '#FF3B30' },
  ];
  
  // State to manage activities - initialized with ACTIVITY_DATA
  const [activities, setActivities] = useState<Record<string, ActivityEntry>>({ ...ACTIVITY_DATA });
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  
  /**
   * Updates the activity text for a specific time slot
   * @param time - The time slot to update
   * @param newActivity - The new activity text
   */
  const handleActivityChange = (time: string, newActivity: string): void => {
    setActivities(prevActivities => ({
      ...prevActivities,
      [time]: {
        ...prevActivities[time],
        activity: newActivity,
      },
    }));
  };
  
  /**
   * Check if content is overflowing whenever dimensions change
   */
  useEffect(() => {
    if (scrollViewHeight > 0 && contentHeight > 0) {
      onOverflowChange(contentHeight > scrollViewHeight);
    }
  }, [scrollViewHeight, contentHeight, onOverflowChange]);
  
  /**
   * Handles scroll event to check if at bottom
   */
  const handleScroll = (event: any): void => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 5;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    onAtBottomChange(isBottom);
  };
  
  return (
    <>
      {/* Header with title and category tags */}
      <View style={styles.logHeader}>
        <Text style={styles.toDoTitle}>Activity Log</Text>
        
        <View style={styles.activityLogTagContainer}>
          {CATEGORY_TAGS.map((tag) => (
            <View key={tag.label} style={styles.activityLogTag}>
              {/* Colored dot indicator */}
              <View 
                style={[
                  styles.activityLogTagDot, 
                  { backgroundColor: tag.color }
                ]} 
              />
              {/* Colored text label */}
              <Text 
                style={[
                  styles.activityLogTagText, 
                  { color: tag.color }
                ]}
              >
                {tag.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Scrollable list of activities */}
      <ScrollView 
        style={styles.activityLogScrollView} 
        showsVerticalScrollIndicator={true}
        indicatorStyle="black"
        contentContainerStyle={styles.activityLogScrollContent}
        onLayout={(event) => setScrollViewHeight(event.nativeEvent.layout.height)}
        onContentSizeChange={(_, height) => setContentHeight(height)}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.activityLogListContainer}>
          {/* Continuous vertical divider line */}
          <View style={styles.activityLogDivider} />
          
          <View style={styles.activityLogList}>
            {timeSlots.map((timeSlot, index) => {
              const activityEntry = activities[timeSlot];
              const isLastItem = index === timeSlots.length - 1;
              
              return (
                <ActivityItem
                  key={timeSlot}
                  time={timeSlot}
                  activity={activityEntry?.activity || ''}
                  duration={activityEntry?.duration}
                  isLast={isLastItem}
                  onActivityChange={handleActivityChange}
                />
              );
            })}
          </View>
        </View>
        <View style={styles.activityLogBottomPadding} />
      </ScrollView>
    </>
  );
}

/**
 * DietLogSection Component
 * 
 * Displays a diet log as a table structure with editable cells.
 * Left column: time (HH:MM), '|', or '...'
 * Right column: editable data field
 */
interface DietLogSectionProps {
  onOverflowChange: (hasOverflow: boolean) => void;
  onAtBottomChange: (isAtBottom: boolean) => void;
}

function DietLogSection({ onOverflowChange, onAtBottomChange }: DietLogSectionProps): React.JSX.Element {
  const [dietEntries, setDietEntries] = useState<DietEntry[]>(INITIAL_DIET_DATA);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  /**
   * Auto-scroll to bottom when entries change
   */
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [dietEntries]);
  
  /**
   * Check if content is overflowing whenever dimensions or entries change
   */
  useEffect(() => {
    if (scrollViewHeight > 0 && contentHeight > 0) {
      onOverflowChange(contentHeight > scrollViewHeight);
    }
  }, [scrollViewHeight, contentHeight, dietEntries, onOverflowChange]);
  
  /**
   * Handles scroll event to check if at bottom
   */
  const handleScroll = (event: any): void => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 5;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    onAtBottomChange(isBottom);
  };
  
  /**
   * Gets current time in HH:MM format
   */
  const getCurrentTime = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  /**
   * Adds a new row with separator - inserts BEFORE the last time entry
   * Only adds if there are no empty separator rows or empty last rows
   */
  const handleAddRow = (): void => {
    setDietEntries(prevEntries => {
      // Find the last entry with type 'time'
      const lastTimeIndex = prevEntries.reduce((lastIndex, entry, index) => {
        return entry.type === 'time' ? index : lastIndex;
      }, -1);
      
      if (lastTimeIndex === -1) return prevEntries; // No time entry found
      
      // Check if there's any separator row ('|') with empty data (excluding the last time row)
      const hasEmptySeparator = prevEntries.some((entry, index) => 
        entry.type === 'separator' && entry.rightColumn.trim() === '' && index < lastTimeIndex
      );
      if (hasEmptySeparator) {
        // Don't add a new row if there's an empty separator
        return prevEntries;
      }
      
      // Check the row just before the last time row
      if (lastTimeIndex > 0) {
        const rowBeforeLastTime = prevEntries[lastTimeIndex - 1];
        if (rowBeforeLastTime && rowBeforeLastTime.rightColumn.trim() === '') {
          // Don't add if the row before last time is empty
          return prevEntries;
        }
      }
      
      // Create new separator entry
      const newId = Math.max(...prevEntries.map(e => e.id), 0) + 1;
      const newSeparator: DietEntry = {
        id: newId,
        leftColumn: '|',
        rightColumn: '',
        type: 'separator',
      };
      
      // Insert before the last time entry
      const newEntries = [...prevEntries];
      newEntries.splice(lastTimeIndex, 0, newSeparator);
      
      return newEntries;
    });
  };
  
  /**
   * Adds a new break row - inserts BEFORE the last time entry
   * Only adds if the row before last time is not already a break
   */
  const handleAddBreak = (): void => {
    setDietEntries(prevEntries => {
      // Find the last entry with type 'time'
      const lastTimeIndex = prevEntries.reduce((lastIndex, entry, index) => {
        return entry.type === 'time' ? index : lastIndex;
      }, -1);
      
      if (lastTimeIndex === -1) return prevEntries; // No time entry found
      
      // Check if the row just before the last time is already a break
      if (lastTimeIndex > 0) {
        const rowBeforeLastTime = prevEntries[lastTimeIndex - 1];
        if (rowBeforeLastTime && rowBeforeLastTime.type === 'break') {
          // Don't add another break if the row before last time is already '...'
          return prevEntries;
        }
      }
      
      // Create new break entry
      const newId = Math.max(...prevEntries.map(e => e.id), 0) + 1;
      const newBreak: DietEntry = {
        id: newId,
        leftColumn: '...',
        rightColumn: '',
        type: 'break',
      };
      
      // Insert before the last time entry
      const newEntries = [...prevEntries];
      newEntries.splice(lastTimeIndex, 0, newBreak);
      
      return newEntries;
    });
  };
  
  /**
   * Updates the data in a diet row
   */
  const handleDataChange = (id: number, newData: string): void => {
    setDietEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.id === id
          ? { ...entry, rightColumn: newData }
          : entry
      )
    );
  };
  
  /**
   * Toggles row selection on long press
   */
  const handleRowLongPress = (id: number): void => {
    setSelectedRowId(selectedRowId === id ? null : id);
  };
  
  /**
   * Clears selection when clicking on a different row
   */
  const handleRowClick = (id: number): void => {
    // If another row is selected, deselect it first
    if (selectedRowId && selectedRowId !== id) {
      setSelectedRowId(null);
    }
  };
  
  /**
   * Deletes the selected row
   */
  const handleDeleteRow = (id: number): void => {
    setDietEntries(prevEntries =>
      prevEntries.filter(entry => entry.id !== id)
    );
    setSelectedRowId(null);
  };
  
  return (
    <>
      {/* Header */}
      <View style={styles.logHeader}>
        <Text style={styles.toDoTitle}>Diet Log</Text>
      </View>

      {/* Scrollable table of diet entries */}
      <TouchableOpacity 
        style={{ flex: 1 }}
        activeOpacity={1}
        onPress={() => selectedRowId && setSelectedRowId(null)}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.dietLogScrollView}
          showsVerticalScrollIndicator={true}
          indicatorStyle="black"
          contentContainerStyle={styles.dietLogScrollContent}
          onLayout={(event) => setScrollViewHeight(event.nativeEvent.layout.height)}
          onContentSizeChange={(_, height) => setContentHeight(height)}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.dietLogTable}>
            {/* Continuous vertical divider line */}
            <View style={styles.dietLogDivider} />
            
            {dietEntries.map((entry, index) => (
              <DietRow
                key={entry.id}
                entry={entry}
                isLast={index === dietEntries.length - 1}
                isSelected={selectedRowId === entry.id}
                onDataChange={handleDataChange}
                onLongPress={handleRowLongPress}
                onClick={handleRowClick}
                onDelete={handleDeleteRow}
              />
            ))}
          </View>
          <View style={styles.dietLogBottomPadding} />
        </ScrollView>
      </TouchableOpacity>
      
      {/* Action buttons */}
      <View style={styles.dietLogActions}>
        <TouchableOpacity 
          style={styles.dietLogButton}
          onPress={handleAddRow}
        >
          <Text style={styles.dietLogButtonText}>add row</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dietLogButton}
          onPress={handleAddBreak}
        >
          <Text style={styles.dietLogButtonText}>add break</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

/**
 * DietRow Component
 * 
 * Renders a single row in the diet table with left column (time/separator/break)
 * and editable right column for data entry.
 * Long-press reveals an inline delete button.
 */
interface DietRowProps {
  entry: DietEntry;
  isLast: boolean;
  isSelected: boolean;
  onDataChange: (id: number, newData: string) => void;
  onLongPress: (id: number) => void;
  onClick: (id: number) => void;
  onDelete: (id: number) => void;
}

function DietRow({ entry, isLast, isSelected, onDataChange, onLongPress, onClick, onDelete }: DietRowProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.rightColumn);
  
  const containerStyle = [
    styles.dietLogRow,
    isLast && styles.dietLogRowLast,
    isSelected && styles.dietLogRowSelected
  ];
  
  /**
   * Enables edit mode or deselects if clicking on a selected row
   */
  const handleStartEdit = (): void => {
    // Clear any other selected row first
    onClick(entry.id);
    
    // If row is selected, deselect it
    if (isSelected) {
      onLongPress(entry.id); // Toggle selection off
      return;
    }
    // Don't allow editing break rows or last time row
    if (entry.type === 'break' || isLast) return;
    setEditText(entry.rightColumn);
    setIsEditing(true);
  };
  
  /**
   * Saves the edited text
   */
  const handleSaveEdit = (): void => {
    onDataChange(entry.id, editText);
    setIsEditing(false);
  };
  
  /**
   * Handles blur event
   */
  const handleBlur = (): void => {
    handleSaveEdit();
  };
  
  /**
   * Handles long press
   */
  const handleLongPress = (): void => {
    onLongPress(entry.id);
  };
  
  /**
   * Handles delete button press
   */
  const handleDelete = (): void => {
    onDelete(entry.id);
  };
  
  return (
    <View style={styles.dietLogRowContainer}>
      <TouchableOpacity
        style={containerStyle}
        onPress={handleStartEdit}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        {/* Left column: time, separator, or break */}
        <Text style={styles.dietLogLeftColumn}>{entry.leftColumn}</Text>
        
        {/* Right column: editable data field */}
        {entry.type === 'break' || isLast ? (
          <View style={styles.dietLogRightColumn} />
        ) : isEditing ? (
          <TextInput
            style={styles.dietLogRightColumnInput}
            value={editText}
            onChangeText={setEditText}
            onBlur={handleBlur}
            onSubmitEditing={handleSaveEdit}
            autoFocus
            maxLength={100}
            returnKeyType="done"
          />
        ) : (
          <View style={styles.dietLogRightColumnTouchable}>
            <Text 
              style={styles.dietLogRightColumnText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {entry.rightColumn}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Delete/Cancel buttons (shown below selected row) */}
      {isSelected && (
        <View style={styles.dietLogRowButtons}>
          <TouchableOpacity 
            style={[styles.dietLogRowButton, styles.dietLogDeleteButtonStyle]}
            onPress={handleDelete}
          >
            <Text style={[styles.dietLogRowButtonText, styles.dietLogDeleteButtonTextStyle]}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dietLogRowButton}
            onPress={handleLongPress}
          >
            <Text style={styles.dietLogRowButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/**
 * ActivityItem Component
 * 
 * Renders a single activity log entry with time, description, and optional duration.
 * Supports inline editing by clicking on the activity text.
 */
function ActivityItem({ 
  time, 
  activity, 
  duration, 
  isLast = false,
  onActivityChange 
}: ActivityItemProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(activity);
  
  const containerStyle = [
    styles.activityLogItem,
    isLast && styles.activityLogItemLast
  ];
  
  /**
   * Enables edit mode and sets the current text
   */
  const handleStartEdit = (): void => {
    setEditText(activity);
    setIsEditing(true);
  };
  
  /**
   * Saves the edited text and exits edit mode
   */
  const handleSaveEdit = (): void => {
    onActivityChange(time, editText);
    setIsEditing(false);
  };
  
  /**
   * Handles blur event - saves changes when user clicks away
   */
  const handleBlur = (): void => {
    handleSaveEdit();
  };
  
  return (
    <View style={containerStyle}>
      <Text style={styles.activityLogTime}>{time}</Text>
      
      {isEditing ? (
        <TextInput
          style={styles.activityLogTextInput}
          value={editText}
          onChangeText={setEditText}
          onBlur={handleBlur}
          onSubmitEditing={handleSaveEdit}
          autoFocus
          maxLength={100}
          returnKeyType="done"
        />
      ) : (
        <TouchableOpacity 
          style={styles.activityLogTextTouchable}
          onPress={handleStartEdit}
          activeOpacity={0.7}
        >
          <Text 
            style={styles.activityLogText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {activity}
          </Text>
        </TouchableOpacity>
      )}
      
      {duration && (
        <Text style={styles.activityLogDuration}>{duration}m</Text>
      )}
    </View>
  );
}

/**
 * ============================================================================
 * HABIT TRACKER SECTION
 * ============================================================================
 */

/**
 * HabitTrackerSection Component
 * 
 * Displays a habit tracker (currently empty placeholder).
 */
interface HabitTrackerSectionProps {
  onOverflowChange: (hasOverflow: boolean) => void;
  onAtBottomChange: (isAtBottom: boolean) => void;
}

/** Sleep score options */
type SleepScore = 'terrible' | 'mid' | 'good' | null;

/** Individual habit item */
interface Habit {
  id: number;
  text: string;
  completed: boolean;
}

/** Initial habit data */
const INITIAL_HABITS: Habit[] = [
  { id: 1, text: 'Woke up immediately with alarm or planned time', completed: true },
  { id: 2, text: 'No lazyness/staying in bed after being awake', completed: true },
  { id: 3, text: 'Morning routine with Cold Shower', completed: true },
  { id: 4, text: '10 Min Physical Activity (Surya Namaskar / Skipping & Boxing / Running)', completed: false },
  { id: 5, text: '10 Min Pranayama', completed: false },
  { id: 6, text: '10 Min Meditation', completed: false },
  { id: 7, text: 'Morning routine executed efficiently (no distractions)', completed: false },
  { id: 8, text: 'Journaling/Self-Reflection/Personal Development content', completed: false },
  { id: 9, text: 'Set Goal & Plan the day', completed: false },
  { id: 10, text: "Didn't eat 4 hours after waking up", completed: false },
  { id: 11, text: 'Intellectual/Planned Work', completed: false },
  { id: 12, text: 'No overeating at any time', completed: false },
  { id: 13, text: 'Exercise/Movement/Outdoor Time', completed: false },
  { id: 14, text: 'Reflect on the day and set an intention/plan for tomorrow', completed: false },
  { id: 15, text: 'Sleep by 11pm', completed: false },
];

function HabitTrackerSection({ onOverflowChange, onAtBottomChange }: HabitTrackerSectionProps): React.JSX.Element {
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [sleepScore, setSleepScore] = useState<SleepScore>('good');
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [buttonLayouts, setButtonLayouts] = useState<{ x: number; width: number }[]>([]);
  const slidePositionAnim = useRef(new Animated.Value(0)).current;
  const slideWidthAnim = useRef(new Animated.Value(0)).current;
  
  /**
   * Check if content is overflowing whenever dimensions change
   */
  useEffect(() => {
    if (scrollViewHeight > 0 && contentHeight > 0) {
      onOverflowChange(contentHeight > scrollViewHeight);
    }
  }, [scrollViewHeight, contentHeight, onOverflowChange]);
  
  /**
   * Handles scroll event to check if at bottom
   */
  const handleScroll = (event: any): void => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 5; // Small threshold to account for rounding
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    onAtBottomChange(isBottom);
  };
  
  /**
   * Animate the sliding background when sleep score changes
   */
  useEffect(() => {
    const index = getActiveIndex();
    if (buttonLayouts.length === 3 && buttonLayouts[index]) {
      Animated.parallel([
        Animated.timing(slidePositionAnim, {
          toValue: buttonLayouts[index].x,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(slideWidthAnim, {
          toValue: buttonLayouts[index].width,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [sleepScore, buttonLayouts]);
  
  /**
   * Handles button layout measurement
   */
  const handleButtonLayout = (index: number, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    setButtonLayouts(prev => {
      const newLayouts = [...prev];
      newLayouts[index] = { x, width };
      return newLayouts;
    });
  };
  
  /**
   * Toggles habit completion status
   */
  const toggleHabit = (id: number): void => {
    setHabits(prevHabits =>
      prevHabits.map(habit =>
        habit.id === id ? { ...habit, completed: !habit.completed } : habit
      )
    );
  };
  
  /**
   * Gets the background color for the active sleep score
   */
  const getActiveSleepScoreColor = () => {
    switch (sleepScore) {
      case 'terrible':
        return '#FF3B30';
      case 'mid':
        return '#FFCC00';
      case 'good':
        return '#34C759';
      default:
        return '#D0D0D0';
    }
  };
  
  /**
   * Gets the position index for the active sleep score
   */
  const getActiveIndex = () => {
    switch (sleepScore) {
      case 'terrible':
        return 0;
      case 'mid':
        return 1;
      case 'good':
        return 2;
      default:
        return 0;
    }
  };
  
  return (
    <>
      {/* Header */}
      <View style={styles.logHeader}>
        <Text style={styles.toDoTitle}>Habit Tracker</Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.habitScrollView} 
        showsVerticalScrollIndicator={true}
        indicatorStyle="black"
        contentContainerStyle={styles.habitScrollContent}
        onLayout={(event) => setScrollViewHeight(event.nativeEvent.layout.height)}
        onContentSizeChange={(_, height) => setContentHeight(height)}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Sleep Score Selector */}
        <View style={styles.sleepScoreContainer}>
          <Text style={styles.sleepScoreLabel}>Sleep Score:</Text>
          <View style={styles.sleepScoreSegmentedControl}>
            {/* Sliding background indicator */}
            <Animated.View 
              style={[
                styles.sleepScoreActiveBackground,
                {
                  backgroundColor: getActiveSleepScoreColor(),
                  left: slidePositionAnim,
                  width: slideWidthAnim,
                }
              ]} 
            />
            
            {/* Button overlays */}
            <TouchableOpacity
              style={styles.sleepScoreButton}
              onPress={() => setSleepScore('terrible')}
              activeOpacity={0.7}
              onLayout={(event) => handleButtonLayout(0, event)}
            >
              <Text style={styles.sleepScoreButtonText}>
                Terrible
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sleepScoreButton}
              onPress={() => setSleepScore('mid')}
              activeOpacity={0.7}
              onLayout={(event) => handleButtonLayout(1, event)}
            >
              <Text style={styles.sleepScoreButtonText}>
                Mid
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sleepScoreButton}
              onPress={() => setSleepScore('good')}
              activeOpacity={0.7}
              onLayout={(event) => handleButtonLayout(2, event)}
            >
              <Text style={styles.sleepScoreButtonText}>
                Good
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Separator Line */}
        <View style={styles.habitSeparator} />

        {/* Habits List */}
        <View style={styles.habitsTable}>
          {habits.map((habit) => (
            <React.Fragment key={habit.id}>
              <TouchableOpacity
                style={styles.habitRow}
                onPress={() => toggleHabit(habit.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.habitText}>{habit.text}</Text>
                <View style={[
                  styles.habitCheckbox,
                  habit.completed && styles.habitCheckboxCompleted
                ]}>
                  {habit.completed && (
                    <IconSymbol
                      name="checkmark"
                      size={10}
                      color={COLORS.WHITE}
                    />
                  )}
                </View>
              </TouchableOpacity>
              {/* Add separator after specific habits */}
              {(habit.id === 9 || habit.id === 13) && (
                <View style={styles.habitSeparator} />
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

/**
 * ============================================================================
 * MAIN SCREEN
 * ============================================================================
 */

/**
 * TrackerScreen Component
 * 
 * Main screen for the tracker tab. Displays:
 * - Calendar date selector
 * - Todo list with importance indicators
 * - Carousel with Activity log, Diet log, and Habit Tracker
 * - Pagination dots indicator
 */
export default function TrackerScreen(): React.JSX.Element {
  const timeSlots = generateTimeSlots();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasOverflow, setHasOverflow] = useState({ activity: true, diet: false, habit: false });
  const [isAtBottom, setIsAtBottom] = useState({ activity: false, diet: false, habit: false });
  const screenWidth = Dimensions.get('window').width;
  
  // Calculate the exact width for each data tab
  // Container width = screenWidth - 40 (margins of 20 on each side)
  const containerWidth = screenWidth - 40;
  
  /**
   * Handles scroll event to update active page indicator
   */
  const handleScroll = (event: any): void => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / containerWidth);
    setActiveIndex(index);
  };
  
  /**
   * Updates overflow state for a specific tab
   */
  const updateOverflow = (tab: 'activity' | 'diet' | 'habit', overflow: boolean): void => {
    setHasOverflow(prev => ({ ...prev, [tab]: overflow }));
  };
  
  /**
   * Updates whether content is scrolled to bottom for a specific tab
   */
  const updateAtBottom = (tab: 'activity' | 'diet' | 'habit', atBottom: boolean): void => {
    setIsAtBottom(prev => ({ ...prev, [tab]: atBottom }));
  };
  
  /**
   * Scrolls to a specific tab when pagination dot is pressed
   */
  const scrollToTab = (index: number): void => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * containerWidth,
        animated: true,
      });
    }
  };
  
  return (
    <View style={styles.screenContainer}>
      <CalendarSection />
      <TodoSection />
      
      {/* Data Container - Holds different data tabs (Activity Log, Diet Log, etc.) */}
      <View style={styles.dataContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.dataScrollView}
          snapToInterval={containerWidth}
          decelerationRate="fast"
        >
          {/* Tab 1: Activity Log */}
          <View style={[styles.dataTab, { width: containerWidth }]}>
            <ActivityLogSection 
              timeSlots={timeSlots} 
              onOverflowChange={(overflow) => updateOverflow('activity', overflow)}
              onAtBottomChange={(atBottom) => updateAtBottom('activity', atBottom)}
            />
          </View>
          
          {/* Tab 2: Diet Log */}
          <View style={[styles.dataTab, { width: containerWidth }]}>
            <DietLogSection 
              onOverflowChange={(overflow) => updateOverflow('diet', overflow)}
              onAtBottomChange={(atBottom) => updateAtBottom('diet', atBottom)}
            />
          </View>
          
          {/* Tab 3: Habit Tracker */}
          <View style={[styles.dataTab, { width: containerWidth }]}>
            <HabitTrackerSection 
              onOverflowChange={(overflow) => updateOverflow('habit', overflow)}
              onAtBottomChange={(atBottom) => updateAtBottom('habit', atBottom)}
            />
          </View>
        </ScrollView>
        
        {/* Gradient overlay to indicate scrollable content - only show when active tab has overflow and not at bottom */}
        {((activeIndex === 0 && hasOverflow.activity && !isAtBottom.activity) || 
          (activeIndex === 1 && hasOverflow.diet && !isAtBottom.diet) || 
          (activeIndex === 2 && hasOverflow.habit && !isAtBottom.habit)) && (
          <LinearGradient
            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)']}
            style={styles.scrollGradient}
            pointerEvents="none"
          />
        )}
        
        {/* Tab Indicator Dots - Press to switch tabs */}
        <View style={styles.tabIndicatorDots}>
          <TouchableOpacity 
            style={[
              styles.tabDot,
              activeIndex === 0 && styles.tabDotActive
            ]}
            onPress={() => scrollToTab(0)}
            activeOpacity={0.7}
            accessibilityLabel="Go to Activity Log"
            accessibilityRole="button"
          />
          <TouchableOpacity 
            style={[
              styles.tabDot,
              activeIndex === 1 && styles.tabDotActive
            ]}
            onPress={() => scrollToTab(1)}
            activeOpacity={0.7}
            accessibilityLabel="Go to Diet Log"
            accessibilityRole="button"
          />
          <TouchableOpacity 
            style={[
              styles.tabDot,
              activeIndex === 2 && styles.tabDotActive
            ]}
            onPress={() => scrollToTab(2)}
            activeOpacity={0.7}
            accessibilityLabel="Go to Habit Tracker"
            accessibilityRole="button"
          />
        </View>
      </View>
    </View>
  );
}

/**
 * ============================================================================
 * STYLES
 * ============================================================================
 */

const styles = StyleSheet.create({
  // ===== SCREEN CONTAINER =====
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },

  // ===== CALENDAR STYLES =====
  calendarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 20,
    marginTop: 60,
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarArrowButton: {
    padding: 0,
  },
  calendarDatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarDateItem: {
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 2,
  },
  calendarDateItemActive: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY_DARK,
  },
  calendarDayLabel: {
    fontSize: 13,
    color: COLORS.GRAY_LIGHT,
    fontWeight: '500',
  },
  calendarDateNumber: {
    fontSize: 13,
    color: COLORS.GRAY_LIGHT,
    fontWeight: '400',
    marginTop: 2,
  },
  calendarDayLabelActive: {
    fontSize: 16,
    color: COLORS.BLACK,
    fontWeight: '600',
    textAlign: 'center',
  },
  calendarDateSubtext: {
    fontSize: 13,
    color: COLORS.GRAY_DARK,
    fontWeight: '300',
    marginBottom: 2,
    textAlign: 'center',
  },
  
  // ===== TODO STYLES =====
  toDo: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 10,
    borderRadius: 18,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toDoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginBottom: 12,
  },

  todoItemContainerImportant: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 70, 58, 0.1)',
    marginLeft: -10,
    marginRight: -10,
    paddingHorizontal: 10,
    position: 'relative',
  },
  todoItemContainerNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginTop: 1,
  },
  todoImportanceRibbon: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 26,
    backgroundColor: COLORS.PRIMARY_RED,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoPrefixColumn: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoPrefixText: {
    fontSize: 16,
    fontWeight: '300',
    textAlign: 'center',
  },
  todoTaskText: {
    fontSize: 13,
    color: COLORS.BLACK,
    fontWeight: '300',
    paddingVertical: 2,
    paddingLeft: 4,
    flex: 1,
  },
  todoStatusCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 0.8,
    borderColor: 'rgb(148, 148, 148)',
    marginRight: 2,
  },
  
  // ===== ACTIVITY LOG STYLES =====
  activityLogScrollView: {
    flex: 1,
    paddingHorizontal: 14,
  },
  activityLogScrollContent: {
    paddingBottom: 0,
  },
  activityLogTagContainer: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  activityLogTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityLogTagDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  activityLogTagText: {
    fontSize: 12,
    fontWeight: '300',
  },
  activityLogListContainer: {
    position: 'relative',
  },
  activityLogDivider: {
    position: 'absolute',
    left: 44,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#D0D0D0',
  },
  activityLogList: {
    gap: 4,
  },
  activityLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  activityLogItemLast: {
    borderBottomWidth: 0,
  },
  activityLogTime: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.BLACK,
    width: 48,
  },
  activityLogTextTouchable: {
    flex: 1,
    marginLeft: 4,
    justifyContent: 'center',
  },
  activityLogText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '300',
  },
  activityLogTextInput: {
    fontSize: 13,
    color: '#333',
    fontWeight: '300',
    flex: 1,
    marginLeft: 4,
    padding: 0,
    paddingVertical: 2,
    minHeight: 20,
  },
  activityLogDuration: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  activityLogBottomPadding: {
    height: 100,
  },
  
  // ===== DATA CONTAINER STYLES =====
  dataContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 20,
    marginBottom: 85,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  dataScrollView: {
    flex: 1,
  },
  dataTab: {
    flex: 1,
  },
  scrollGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  tabIndicatorDots: {
    position: 'absolute',
    bottom: 3,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
    backgroundColor: 'transparent',
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: 'transparent',
  },
  tabDotActive: {
    backgroundColor: '#8F8F8F',
    borderColor: '#D0D0D0',
  },
  
  // ===== SHARED LOG STYLES =====
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  
  // ===== DIET LOG STYLES =====
  dietLogScrollView: {
    flex: 1,
    paddingHorizontal: 14,
  },
  dietLogScrollContent: {
    paddingBottom: 0,
  },
  dietLogTable: {
    position: 'relative',
  },
  dietLogDivider: {
    position: 'absolute',
    left: 44,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#D0D0D0',
  },
  dietLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dietLogRowLast: {
    // No special styling needed
  },
  dietLogLeftColumn: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.BLACK,
    width: 48,
    textAlign: 'center',
    paddingRight: 8,
  },
  dietLogRightColumn: {
    flex: 1,
    marginLeft: 4,
  },
  dietLogRightColumnTouchable: {
    flex: 1,
    marginLeft: 4,
    justifyContent: 'center',
  },
  dietLogRightColumnText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '300',
  },
  dietLogRightColumnInput: {
    fontSize: 13,
    color: '#333',
    fontWeight: '300',
    flex: 1,
    marginLeft: 4,
    padding: 0,
    paddingVertical: 2,
    minHeight: 20,
  },
  dietLogBottomPadding: {
    height: 20,
  },
  dietLogRowContainer: {
    // Container for each row
  },
  dietLogRowSelected: {
    backgroundColor: '#F5F5F5',
  },
  dietLogRowButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    paddingVertical: 8,
  },
  dietLogRowButton: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: '#5A5A5A',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 75,
  },
  dietLogRowButtonText: {
    fontSize: 12,
    color: '#2A2A2A',
    fontWeight: '600',
    textAlign: 'center',
  },
  dietLogDeleteButtonStyle: {
    backgroundColor: '#FF3B30',
    borderColor: '#E0342A',
  },
  dietLogDeleteButtonTextStyle: {
    color: COLORS.WHITE,
    fontWeight: '700',
  },
  dietLogActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
    paddingHorizontal: 14,
  },
  dietLogButton: {
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: '#A0A0A0',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
    minWidth: 108,
  },
  dietLogButtonText: {
    fontSize: 14,
    color: '#5A5A5A',
    fontWeight: '700',
    textAlign: 'center',
  },
  
  // ===== HABIT TRACKER STYLES =====
  habitScrollView: {
    flex: 1,
    paddingHorizontal: 14,
  },
  habitScrollContent: {
    paddingBottom: 20,
  },
  sleepScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sleepScoreLabel: {
    fontSize: 12,
    fontWeight: '300',
    color: COLORS.BLACK,
  },
  sleepScoreSegmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#D0D0D0',
    borderRadius: 8,
    position: 'relative',
    alignSelf: 'flex-end',
    padding: 2,
    gap: 2,
  },
  sleepScoreActiveBackground: {
    position: 'absolute',
    borderRadius: 6,
    top: 2,
    bottom: 2,
  },
  sleepScoreButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sleepScoreButtonText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    color: COLORS.WHITE,
  },
  habitSeparator: {
    height: 1,
    backgroundColor: '#5A5A5A',
    width: '100%',
    alignSelf: 'center',
    marginVertical: 1,
  },
  habitsTable: {
    gap: 0,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  habitText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.BLACK,
    fontWeight: '200',
    marginRight: 8,
    lineHeight: 18,
  },
  habitCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitCheckboxCompleted: {
    backgroundColor: '#8F8F8F',
    borderColor: '#8F8F8F',
  },
});


