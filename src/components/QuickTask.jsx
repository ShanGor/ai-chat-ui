import {Card, Flex } from "antd"
import {
    ArrowUpOutlined,
  } from '@ant-design/icons';

import "./QuickTask.css"
const { Meta } = Card;

const QuickTask = ({title, description, onClick=null}) => {
    return (
    <Card bordered={false} onClick={()=> onClick && onClick(`${title} ${description}`)} className="quick-task">
    <Flex>
      <Meta title={title} style={{textAlign: 'left', width: '90%'}}
            description={description} />
      <span className="hide">
        <ArrowUpOutlined style={{fontSize: '1.5rem'}} />
      </span>
    </Flex>
    </Card>
    )
}

export default QuickTask