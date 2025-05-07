import { useState, useEffect } from 'react'

/**
 * Custom hook để tạo debounce cho giá trị
 * @param value Giá trị cần debounce
 * @param delay Thời gian delay (ms)
 * @returns Giá trị sau khi debounce
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        // Tạo timer để delay việc cập nhật giá trị
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        // Cleanup function để clear timer khi component unmount hoặc value thay đổi
        return () => {
            clearTimeout(timer)
        }
    }, [value, delay]) // Chỉ chạy lại effect khi value hoặc delay thay đổi

    return debouncedValue
}
