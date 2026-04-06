import { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventsStore } from '../../store/eventsStore';
import { useTodosStore } from '../../store/todosStore';
import { EmptyState } from '../EmptyState';
import { TodayTaskCard } from '../TodayTaskCard';
import { COLORS } from '../../constants/colors';
import { useThemeColors } from '../../store/themeStore';
import { toLocalDateStr } from '../../utils/dateUtils';
import type { Todo, Event, TodoStatus } from '@repo/types';
import { STATUS_META, todayStr, seg } from './segStyles';

export function TodaySegment() {
  const c = useThemeColors();
  const { todos, isLoading: tLoading, fetchTodos, updateTodo } = useTodosStore();
  const { events, isLoading: eLoading, fetchEvents } = useEventsStore();

  useFocusEffect(useCallback(() => { fetchTodos(); fetchEvents(); }, [fetchTodos, fetchEvents]));

  const today = todayStr();

  const dayTodos = todos.filter((t) => toLocalDateStr(t.createdAt) === today);

  const completedCount  = dayTodos.filter((t) => t.status === 'COMPLETED').length;
  const inProgressCount = dayTodos.filter((t) => t.status === 'IN_PROGRESS').length;
  const todoCount       = dayTodos.filter((t) => t.status === 'TODO').length;
  const totalCount = dayTodos.length;

  const dayEvents = events
    .filter((e) => toLocalDateStr(e.startDate) === today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const sortedTodos = [...dayTodos].sort((a, b) => {
    const order: Record<string, number> = { IN_PROGRESS: 0, TODO: 1, COMPLETED: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });

  type Item =
    | { kind: 'section'; label: string; count: number }
    | { kind: 'task'; data: Todo }
    | { kind: 'event'; data: Event }
    | { kind: 'empty'; msg: string };

  const items: Item[] = [
    { kind: 'section', label: "Today's Tasks", count: dayTodos.length },
    ...(sortedTodos.length > 0
      ? sortedTodos.map((t): Item => ({ kind: 'task', data: t }))
      : [{ kind: 'empty', msg: 'No tasks for today' } as Item]),
    { kind: 'section', label: "Today's Events", count: dayEvents.length },
    ...(dayEvents.length > 0
      ? dayEvents.map((e): Item => ({ kind: 'event', data: e }))
      : [{ kind: 'empty', msg: 'No events today' } as Item]),
  ];

  if (tLoading && eLoading && todos.length === 0 && events.length === 0) {
    return <View style={seg.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <TodayTaskCard
        completed={completedCount}
        inProgress={inProgressCount}
        todo={todoCount}
        total={totalCount}
        date={today}
      />
      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={seg.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item.kind === 'section') {
            return (
              <View style={seg.sectionRow}>
                <Text style={[seg.sectionLabel, { color: c.textSub }]}>{item.label}</Text>
                {item.count > 0 && (
                  <View style={seg.badge}><Text style={seg.badgeText}>{item.count}</Text></View>
                )}
              </View>
            );
          }
          if (item.kind === 'task') {
            const t = item.data;
            const meta = STATUS_META[t.status];
            return (
              <View style={[seg.taskRow, { borderLeftWidth: 3, borderLeftColor: meta.color, backgroundColor: c.surface }]}>
                <View style={[seg.taskStatusDot, { backgroundColor: meta.color }]} />
                <Text style={[seg.taskTitle, { color: c.text }, t.status === 'COMPLETED' && seg.strikethrough]} numberOfLines={1}>
                  {t.title}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const next: TodoStatus = t.status === 'TODO' ? 'IN_PROGRESS' : t.status === 'IN_PROGRESS' ? 'COMPLETED' : 'TODO';
                    updateTodo(t.id, { status: next });
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={t.status === 'COMPLETED' ? 'checkmark-circle' : t.status === 'IN_PROGRESS' ? 'time-outline' : 'ellipse-outline'}
                    size={22} color={meta.color}
                  />
                </TouchableOpacity>
              </View>
            );
          }
          if (item.kind === 'event') {
            const e = item.data;
            return (
              <View style={[seg.eventRow, { backgroundColor: c.surface }]}>
                <View style={[seg.eventBar, { backgroundColor: e.color }]} />
                <View style={seg.eventBody}>
                  <Text style={[seg.eventTitle, { color: c.text }]} numberOfLines={1}>{e.title}</Text>
                  <Text style={seg.eventTime}>
                    {new Date(e.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(e.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }
          if (item.kind === 'empty') {
            return (
              <EmptyState
                message={item.msg}
                variant={item.msg.toLowerCase().includes('task') ? 'tasks' : 'events'}
                compact
              />
            );
          }
          return null;
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshing={tLoading}
        onRefresh={fetchTodos}
      />
    </View>
  );
}
