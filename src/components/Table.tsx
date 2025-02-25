// Table.tsx
import React, { ReactNode } from 'react';

export type Column<T> = {
  key: string;
  title: string;
  render?: (item: T, index: number) => ReactNode;
  width?: string | number;
  className?: string;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  emptyText?: string;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
};

const Table = <T extends {}>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  className = '',
  tableClassName = '',
  headerClassName = 'bg-[#d9d9d9] border-b border-black',
  bodyClassName = 'bg-white',
  emptyText = 'Không có dữ liệu',
  isLoading = false,
  loadingComponent,
}: TableProps<T>) => {
  return (
    <div className={`overflow-x-auto border border-black rounded-md ${className}`}>
      <table className={`min-w-full divide-y divide-gray-200 ${tableClassName}`}>
        <thead className={headerClassName}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-[#000000] uppercase tracking-wider ${column.className || ''}`}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y divide-gray-200 ${bodyClassName}`}>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center">
                {loadingComponent || 'Đang tải dữ liệu...'}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((column) => (
                  <td key={`${keyExtractor(item)}-${column.key}`} className="px-6 py-4 whitespace-nowrap border-b border-black">
                    {column.render ? column.render(item, index) : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;