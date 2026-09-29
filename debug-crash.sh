#!/bin/bash

echo "🐛 robotmind Launcher Debug Script"
echo "=============================="
echo ""

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found. Please install Android SDK platform tools."
    exit 1
fi

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device found. Please connect your device and enable USB debugging."
    exit 1
fi

echo "✅ Android device connected"
echo ""

# Function to show menu
show_menu() {
    echo "Choose debugging option:"
    echo "1. 📱 View live app logs (React Native + Android)"
    echo "2. 💥 View crash logs (last 500 lines)"
    echo "3. 🔍 Search for specific error"
    echo "4. 📊 Monitor memory usage"
    echo "5. 🧹 Clear logs and start fresh monitoring"
    echo "6. 📋 Save logs to file"
    echo "0. ❌ Exit"
    echo ""
    read -p "Enter choice (0-6): " choice
}

# Function to monitor live logs
monitor_live() {
    echo "🔄 Monitoring live logs for robotmind launcher..."
    echo "Press Ctrl+C to stop"
    echo "=========================================="
    adb logcat | grep -E "(io.robotmind.luncher|ReactNativeJS|System.err|AndroidRuntime|FATAL|ERROR)"
}

# Function to show crash logs
show_crashes() {
    echo "💥 Searching for recent crashes..."
    echo "================================="
    adb logcat -d | grep -E "(FATAL|AndroidRuntime|System.err)" | tail -20
    echo ""
    echo "🔍 Searching for React Native errors..."
    echo "======================================="
    adb logcat -d | grep -E "ReactNativeJS" | tail -10
}

# Function to search for specific error
search_error() {
    read -p "🔍 Enter search term: " search_term
    echo "Searching for: $search_term"
    echo "============================="
    adb logcat -d | grep -i "$search_term" | tail -20
}

# Function to monitor memory
monitor_memory() {
    echo "📊 Memory usage for robotmind launcher:"
    echo "=================================="
    while true; do
        memory=$(adb shell dumpsys meminfo io.robotmind.luncher | grep "TOTAL" | head -1)
        if [[ -n "$memory" ]]; then
            echo "$(date): $memory"
        else
            echo "$(date): App not running or package name incorrect"
        fi
        sleep 2
    done
}

# Function to clear logs
clear_logs() {
    echo "🧹 Clearing logs..."
    adb logcat -c
    echo "✅ Logs cleared. Starting fresh monitoring..."
    monitor_live
}

# Function to save logs
save_logs() {
    timestamp=$(date +"%Y%m%d_%H%M%S")
    filename="robotmind_logs_$timestamp.txt"
    echo "📋 Saving logs to $filename..."

    echo "=== robotmind LAUNCHER DEBUG LOGS ===" > "$filename"
    echo "Generated: $(date)" >> "$filename"
    echo "=================================" >> "$filename"
    echo "" >> "$filename"

    echo "=== RECENT CRASH LOGS ===" >> "$filename"
    adb logcat -d | grep -E "(FATAL|AndroidRuntime|System.err)" | tail -50 >> "$filename"
    echo "" >> "$filename"

    echo "=== REACT NATIVE LOGS ===" >> "$filename"
    adb logcat -d | grep -E "ReactNativeJS" | tail -50 >> "$filename"
    echo "" >> "$filename"

    echo "=== robotmind APP LOGS ===" >> "$filename"
    adb logcat -d | grep -E "io.robotmind.luncher" | tail -100 >> "$filename"

    echo "✅ Logs saved to $filename"
}

# Main menu loop
while true; do
    show_menu
    case $choice in
        1)
            monitor_live
            ;;
        2)
            show_crashes
            ;;
        3)
            search_error
            ;;
        4)
            monitor_memory
            ;;
        5)
            clear_logs
            ;;
        6)
            save_logs
            ;;
        0)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please try again."
            ;;
    esac
    echo ""
    read -p "Press Enter to continue..."
done