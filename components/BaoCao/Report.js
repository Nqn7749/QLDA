import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { PieChart } from 'react-native-chart-kit';

const ReportScreen = ({ navigation }) => {
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [incompleteTasks, setIncompleteTasks] = useState(0);
  const [tasksByDate, setTasksByDate] = useState([]);
  const [tasksByCategory, setTasksByCategory] = useState([]);
  
  const db = useSQLiteContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tổng số công việc
        const totalResult = await db.getAllAsync("SELECT COUNT(*) AS total FROM notesTable");
        setTotalTasks(totalResult[0].total);

        // Số công việc đã hoàn thành
        const completedResult = await db.getAllAsync(
          "SELECT COUNT(*) AS total FROM notesTable WHERE completed = 1"
        );
        setCompletedTasks(completedResult[0].total);

        // Số công việc chưa hoàn thành
        const incompleteResult = await db.getAllAsync(
          "SELECT COUNT(*) AS total FROM notesTable WHERE completed = 0"
        );
        setIncompleteTasks(incompleteResult[0].total);

        // Công việc theo ngày
        const dateResult = await db.getAllAsync(
          "SELECT date, COUNT(*) AS count FROM notesTable GROUP BY date ORDER BY date DESC"
        );
        setTasksByDate(dateResult);

        // Công việc theo danh mục
        const categoryResult = await db.getAllAsync(
          "SELECT category, COUNT(*) AS count FROM notesTable GROUP BY category"
        );
        setTasksByCategory(categoryResult);
      } catch (error) {
        console.error("Error fetching report data:", error);
      }
    };

    fetchData();
  }, [db]);

    // Dữ liệu cho biểu đồ tròn
    const pieChartData = [
        {
        name: 'Đã hoàn thành',
        population: completedTasks,
        color: '#4CAF50',
        legendFontColor: '#FFFFFF',
        legendFontSize: 14
        },
        {
        name: 'Chưa hoàn thành',
        population: incompleteTasks,
        color: '#F44336',
        legendFontColor: '#FFFFFF',
        legendFontSize: 14
        }
    ];

  const screenWidth = Dimensions.get('window').width;

  return (
    <ImageBackground 
      source={require('../../assets/e7a7e1b7a1dfd69b0f1a95e9b65ff06c.jpg')} 
      style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Báo cáo công việc</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Tổng số công việc:</Text>
          <Text style={styles.value}>{totalTasks}</Text>
        </View>

        {/* Biểu đồ tròn */}
        <View style={styles.chartContainer}>
          <PieChart
            data={pieChartData}
            width={screenWidth}
            height={250}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              propsForLabels: {
                fontSize: 12,
                fontWeight: 'bold',
                fill: '#000000'  // Chỉnh màu chữ cho các nhãn trong biểu đồ
              }
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            hasLegend={false}  // Tắt phần hiển thị chữ trong biểu đồ tròn
            avoidFalseZero
            center={[screenWidth / 4, 0]}
            />
        </View>

        {/* Thống kê chi tiết */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Đã hoàn thành:</Text>
            <Text style={[styles.statValue, {color: '#4CAF50'}]}>
              {completedTasks} ({Math.round((completedTasks / totalTasks) * 100) || 0}%)
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Chưa hoàn thành:</Text>
            <Text style={[styles.statValue, {color: '#F44336'}]}>
              {incompleteTasks} ({Math.round((incompleteTasks / totalTasks) * 100) || 0}%)
            </Text>
          </View>
        </View>

        <Text style={styles.subTitle}>Thống kê theo ngày:</Text>
        {tasksByDate.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{item.date}:</Text>
            <Text style={styles.value}>{item.count}</Text>
          </View>
        ))}

        <Text style={styles.subTitle}>Thống kê theo danh mục:</Text>
        {tasksByCategory.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>{item.category || "Chưa phân loại"}:</Text>
            <Text style={styles.value}>{item.count}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#FFFFFF",
    textAlign: "center",
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#FFFFFF",
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  chartContainer: {
    marginVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  statsContainer: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginBottom: 5,
    borderRadius: 5,
  },
  label: {
    fontSize: 16,
    color: "#333",
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0066cc",
  },
  backButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#6200ee",
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ReportScreen;
