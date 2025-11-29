import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderPlus } from 'lucide-react';
import { bridge, FileChange } from '../api/bridge';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isGenerated?: boolean; // Flag to show this was AI-generated
}

// Empty initial state - will be populated by generated files
const EMPTY_PROJECT: FileNode = {
  id: 'root',
  name: 'Generated Files',
  type: 'folder',
  children: []
};

/**
 * Convert flat file paths to a tree structure
 */
function buildFileTree(files: FileChange[]): FileNode {
  const root: FileNode = {
    id: 'root',
    name: 'Generated Files',
    type: 'folder',
    children: []
  };

  files.forEach(file => {
    const parts = file.path.split('/').filter(p => p);
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const existingChild = current.children?.find(c => c.name === part);

      if (existingChild) {
        current = existingChild;
      } else {
        const newNode: FileNode = {
          id: file.path + '_' + index,
          name: part,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          isGenerated: isFile
        };
        if (!current.children) current.children = [];
        current.children.push(newNode);
        current = newNode;
      }
    });
  });

  return root;
}

interface PrimarySideBarProps {
  isVisible: boolean;
  width: number;
  setWidth: (w: number) => void;
}

const FileTreeItem: React.FC<{ node: FileNode; depth: number }> = ({ node, depth }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Get file extension for icon color
  const getFileIconColor = (name: string) => {
    if (name.endsWith('.tsx') || name.endsWith('.jsx')) return 'text-cyan-400';
    if (name.endsWith('.ts') || name.endsWith('.js')) return 'text-yellow-400';
    if (name.endsWith('.css') || name.endsWith('.scss')) return 'text-pink-400';
    if (name.endsWith('.json')) return 'text-green-400';
    if (name.endsWith('.html')) return 'text-orange-400';
    if (name.endsWith('.md')) return 'text-blue-300';
    return 'text-blue-400';
  };

  return (
    <div>
      <div 
        className={`flex items-center py-1 px-2 hover:bg-[#2a2d2e] cursor-pointer text-sm ${node.isGenerated ? 'text-astra-blue' : 'text-[#cccccc]'}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => node.type === 'folder' && setIsOpen(!isOpen)}
      >
        <span className="mr-1 opacity-80">
          {node.type === 'folder' ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <File size={14} className={getFileIconColor(node.name)} />
          )}
        </span>
        {node.type === 'folder' && <Folder size={14} className="mr-2 text-yellow-500" />}
        <span className="truncate">{node.name}</span>
        {node.isGenerated && <span className="ml-2 text-[10px] text-astra-blue/70 bg-astra-blue/10 px-1 rounded">NEW</span>}
      </div>
      {node.type === 'folder' && isOpen && node.children?.map(child => (
        <FileTreeItem key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};

const PrimarySideBar: React.FC<PrimarySideBarProps> = ({ isVisible, width, setWidth }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [fileTree, setFileTree] = useState<FileNode>(EMPTY_PROJECT);
  const [hasGeneratedFiles, setHasGeneratedFiles] = useState(false);

  // Listen for file changes from the debate
  useEffect(() => {
    const handleFileChanges = (data: { success: boolean; fileChanges: FileChange[] }) => {
      console.log('[PrimarySideBar] Received file_changes:', data);
      if (data.success && data.fileChanges && data.fileChanges.length > 0) {
        const tree = buildFileTree(data.fileChanges);
        setFileTree(tree);
        setHasGeneratedFiles(true);
      }
    };

    // Use the returned unsubscribe function for proper cleanup
    const unsubscribe = bridge.onFileChanges(handleFileChanges);
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      } else {
        // Fallback: remove specific callback
        bridge.removeFileChangesListener(handleFileChanges);
      }
    };
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = mouseMoveEvent.clientX - 48; // Subtract ActivityBar width
      if (newWidth > 150 && newWidth < 600) {
        setWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing]);

  if (!isVisible) return null;

  return (
    <div 
      className="bg-[#252526] border-r border-[#2b2b2b] flex flex-col h-full relative shrink-0"
      style={{ width }}
    >
      <div className="h-9 px-4 flex items-center text-xs font-bold text-[#bbbbbb] uppercase tracking-wide">
        Explorer
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {hasGeneratedFiles ? (
          <FileTreeItem node={fileTree} depth={0} />
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            <FolderPlus size={32} className="mx-auto mb-2 opacity-50" />
            <p>No files yet</p>
            <p className="text-xs mt-1 text-gray-600">
              Generated files will appear here after you run a task
            </p>
          </div>
        )}
      </div>

      {/* Drag Handle */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-astra-blue z-50 transition-colors"
        onMouseDown={startResizing}
      />
    </div>
  );
};

export default PrimarySideBar;

