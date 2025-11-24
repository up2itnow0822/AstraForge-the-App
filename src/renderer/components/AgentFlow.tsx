import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import AgentNode from './AgentNode';
import { AgentState } from './AgentPanel';

interface AgentFlowProps {
  agents: AgentState[];
}

const nodeTypes = {
  agent: AgentNode,
};

const AgentFlow: React.FC<AgentFlowProps> = ({ agents }) => {
  // Layout Constants
  const CENTER_X = 250;
  const START_Y = 50;
  const RADIUS = 250;

  // Transform generic agents list into Graph Nodes
  const nodes: Node[] = useMemo(() => {
    // Identify Nexus (Leader)
    const nexus = agents.find(a => a.name === 'Nexus') || agents[0];
    const others = agents.filter(a => a.name !== nexus?.name);

    const graphNodes: Node[] = [];

    // 1. Place Nexus at Top Center
    if (nexus) {
      graphNodes.push({
        id: nexus.id,
        type: 'agent',
        position: { x: CENTER_X, y: START_Y },
        data: { 
          label: nexus.name, 
          role: nexus.role, 
          status: nexus.status, 
          name: nexus.name 
        },
        selected: nexus.status === 'speaking'
      });
    }

    // 2. Place others in a semi-circle below
    others.forEach((agent, index) => {
      // Calculate angle for semi-circle (spanning 180 degrees)
      const angleStep = 180 / (others.length + 1);
      const angle = 180 - (angleStep * (index + 1)); // distribute 0 to 180
      const radian = (angle * Math.PI) / 180;

      const x = CENTER_X + RADIUS * Math.cos(radian);
      const y = START_Y + 150 + RADIUS * Math.sin(radian) * 0.8;

      graphNodes.push({
        id: agent.id,
        type: 'agent',
        position: { x, y },
        data: { 
          label: agent.name, 
          role: agent.role, 
          status: agent.status, 
          name: agent.name 
        },
        selected: agent.status === 'speaking'
      });
    });

    return graphNodes;
  }, [agents]);

  // Create Edges (Star Topology: Everyone connects to Nexus)
  const edges: Edge[] = useMemo(() => {
    const nexus = agents.find(a => a.name === 'Nexus') || agents[0];
    if (!nexus) return [];

    return agents
      .filter(a => a.id !== nexus.id)
      .map(agent => {
        const isActive = agent.status === 'speaking' || nexus.status === 'speaking';
        return {
          id: `e-${nexus.id}-${agent.id}`,
          source: nexus.id,
          target: agent.id,
          type: 'smoothstep',
          animated: isActive,
          style: { 
            stroke: isActive ? '#22c55e' : '#4b5563', 
            strokeWidth: isActive ? 3 : 1,
            opacity: isActive ? 1 : 0.5
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isActive ? '#22c55e' : '#4b5563',
          },
        };
      });
  }, [agents]);

  return (
    <div className="w-full h-full bg-gray-900 border-l border-gray-700">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode="dark"
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#374151" gap={20} />
        <Controls className="!bg-gray-800 !border-gray-700 !fill-gray-400" />
      </ReactFlow>
    </div>
  );
};

export default AgentFlow;
