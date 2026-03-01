export interface MindMapResult {
  map: string;
}

export interface GraphNode {
  id: string;
  label: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

export interface GraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  plainText: string;
}
