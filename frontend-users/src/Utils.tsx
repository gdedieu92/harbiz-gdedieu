import { CSVLink } from "react-csv";
import { Button } from 'antd';
import { ExportCsvProp } from "./Interfaces";
import { DownloadOutlined } from '@ant-design/icons';


const ExportButton: React.FC<ExportCsvProp> = ({ filename = 'random-users-list.csv', userList, textButton }) => {

    if (userList.length) {
        return (
            <Button type="primary" shape="round" icon={<DownloadOutlined />}>
                <CSVLink
                    filename={filename}
                    data={userList}
                    className="ant-btn  ant-btn-primary" >
                    {textButton}
                </CSVLink>
            </Button>
        );
    }
    return null;
}

export { ExportButton };