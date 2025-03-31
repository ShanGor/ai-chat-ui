import {
    CloudUploadOutlined,
    SettingOutlined,
    UnorderedListOutlined
} from "@ant-design/icons";
import {Menu} from "antd";
import {useState} from "react";
import {useNavigate} from "react-router";


const items = [
    {
        key: 'docs',
        label: 'Documents',
        icon: <UnorderedListOutlined />,
    },
    {
        key: 'settings',
        label: 'Settings',
        icon: <SettingOutlined />,
    },
];
const LeftSiderAdmin = (props) => {
    const [current, setCurrent] = useState('1');

    const navigate = useNavigate();

    const onClick = (e) => {
        const subPath = e.key
        setCurrent(subPath);
        navigate(`./${subPath}`)
    };

    return <Menu
        theme={'dark'}
        onClick={onClick}
        style={{
            width: 256,
        }}
        defaultOpenKeys={['docs']}
        selectedKeys={[current]}
        mode="inline"
        items={items}
    />
}

export default LeftSiderAdmin