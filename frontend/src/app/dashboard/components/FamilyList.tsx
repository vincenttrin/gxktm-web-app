'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { getFamilies } from '@/lib/api';
import {
  Family,
  FamilyQueryParams,
  AcademicYear,
} from '@/types/family';
import FamilyCard from './FamilyCard';
import FamilyModal from './FamilyModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import Toast from './Toast';
import Pagination from './Pagination';

interface FamilyListProps {
  selectedYear: AcademicYear | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function FamilyList({ selectedYear }: FamilyListProps) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(12);
  
  // Search & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('family_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [deletingFamily, setDeletingFamily] = useState<Family | null>(null);
  
  // Toast notifications
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadFamilies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params: FamilyQueryParams = {
        page: currentPage,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      
      const response = await getFamilies(params);
      setFamilies(response.items);
      setTotalPages(response.total_pages);
      setTotalItems(response.total);
    } catch (err) {
      console.error('Failed to load families:', err);
      setError('Failed to load families. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleFamilyCreated = () => {
    setIsCreateModalOpen(false);
    loadFamilies();
    showToast('Family created successfully', 'success');
  };

  const handleFamilyUpdated = () => {
    setEditingFamily(null);
    loadFamilies();
    showToast('Family updated successfully', 'success');
  };

  const handleFamilyDeleted = () => {
    setDeletingFamily(null);
    loadFamilies();
    showToast('Family deleted successfully', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const SortButton = ({
    field,
    label,
  }: {
    field: string;
    label: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
        sortBy === field
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
      {sortBy === field &&
        (sortOrder === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        ))}
    </button>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Families</h2>
          <p className="text-sm text-gray-500 mt-1">
            {totalItems} {totalItems === 1 ? 'family' : 'families'} total
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          Add Family
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search families..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <SortButton field="family_name" label="Name" />
          <SortButton field="city" label="City" />
          <SortButton field="state" label="State" />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={loadFamilies}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading families...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && families.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {debouncedSearch ? 'No families found' : 'No families yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {debouncedSearch
              ? 'Try adjusting your search query'
              : 'Get started by creating your first family'}
          </p>
          {!debouncedSearch && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Family
            </button>
          )}
        </div>
      )}

      {/* Family Cards Grid */}
      {!isLoading && !error && families.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {families.map((family) => (
              <FamilyCard
                key={family.id}
                family={family}
                onEdit={() => setEditingFamily(family)}
                onDelete={() => setDeletingFamily(family)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Create Family Modal */}
      {isCreateModalOpen && (
        <FamilyModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleFamilyCreated}
          showToast={showToast}
        />
      )}

      {/* Edit Family Modal */}
      {editingFamily && (
        <FamilyModal
          family={editingFamily}
          onClose={() => setEditingFamily(null)}
          onSuccess={handleFamilyUpdated}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingFamily && (
        <DeleteConfirmDialog
          family={deletingFamily}
          onClose={() => setDeletingFamily(null)}
          onConfirm={handleFamilyDeleted}
          showToast={showToast}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
