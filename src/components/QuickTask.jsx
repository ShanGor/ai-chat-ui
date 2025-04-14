import {Badge, Card, Flex} from "antd"
import {
    ArrowUpOutlined,
  } from '@ant-design/icons';

import "./QuickTask.css"
const { Meta } = Card;

const QuickTask = ({title, description, onClick=null, agentName=null}) => {

    const formatTitle = () => {
        return <span>
            {title}
            {agentName && <Badge
                count={`Agent`}
                style={{ backgroundColor: 'purple', marginLeft: '1rem', marginTop: '-0.5rem' }}
            />}
        </span>
    }

    return (
    <Card variant="borderless" onClick={()=> onClick && onClick({
        message: `${title} ${description}`,
        agentName: agentName,
    })} className="quick-task">
    <Flex>
      <Meta title={formatTitle()} style={{textAlign: 'left', width: '90%'}}
            description={description} />
      <span className="hide">
        <ArrowUpOutlined style={{fontSize: '1.5rem'}} />
      </span>
    </Flex>
    </Card>
    )
}

export default QuickTask