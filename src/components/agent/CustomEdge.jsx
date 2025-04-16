import {BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow} from "@xyflow/react";

export const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, curvature }) => {
    const reactFlow = useReactFlow();
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature,
    });
    const edge = reactFlow.getEdge(id)
    const label = edge?.label;

    return (
        <>
            <BaseEdge id={id} path={edgePath}/>
            <EdgeLabelRenderer>
                <span
                    style={{
                        position: 'absolute',
                        fontSize: '0.8rem',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan">
                    {label}
                </span>
            </EdgeLabelRenderer>
        </>
    );
};