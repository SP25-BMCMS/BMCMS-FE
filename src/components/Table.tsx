import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  animated?: boolean;
};

const rowVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.5,
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }),
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.3 }
  }
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
  animated = true,
}: TableProps<T>) => {
  // Animated row component
  const AnimatedRow = ({ item, index }: { item: T, index: number }) => (
    <motion.tr
      key={keyExtractor(item)}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
      onClick={() => onRowClick && onRowClick(item)}
    >
      {columns.map((column) => (
        <td 
          key={`${keyExtractor(item)}-${column.key}`} 
          className="px-6 py-4 whitespace-nowrap border-b border-black"
        >
          {column.render ? column.render(item, index) : (item as any)[column.key]}
        </td>
      ))}
    </motion.tr>
  );

  // Regular row component
  const RegularRow = ({ item, index }: { item: T, index: number }) => (
    <tr
      key={keyExtractor(item)}
      className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
      onClick={() => onRowClick && onRowClick(item)}
    >
      {columns.map((column) => (
        <td 
          key={`${keyExtractor(item)}-${column.key}`} 
          className="px-6 py-4 whitespace-nowrap border-b border-black"
        >
          {column.render ? column.render(item, index) : (item as any)[column.key]}
        </td>
      ))}
    </tr>
  );

  // Loading animation
  const loadingVariants = {
    animate: {
      rotate: 360,
      scale: [1, 1.2, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const LoadingAnimation = () => (
    <div className="flex justify-center items-center py-4">
      <motion.div
        animate="animate"
        variants={loadingVariants}
        className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
      />
      <span className="ml-3">Đang tải dữ liệu...</span>
    </div>
  );

  return (
    <div className={`overflow-x-auto border border-black rounded-md ${className} overflow-visible`}>
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
                {loadingComponent || <LoadingAnimation />}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            <AnimatePresence>
              {data.map((item, index) => 
                animated ? (
                  <AnimatedRow key={keyExtractor(item)} item={item} index={index} />
                ) : (
                  <RegularRow key={keyExtractor(item)} item={item} index={index} />
                )
              )}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
