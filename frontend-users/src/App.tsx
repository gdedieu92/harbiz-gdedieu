import React, { useCallback, useEffect, useState } from 'react';

//Utils
import API from './Api';
import { ApiRandomGetResponse, ApiUserStructure, FetchError, TxtVal, User, UserIndexName } from './Interfaces';
import { ExportButton } from './Utils';

//Table
import { Button, Table, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';

//Draggable
import { RowDrag } from './RowDrag';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';


const App: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersSelected, setUsersSelected] = useState<User[]>([]);


  const getUserData = useCallback(() => {
    setLoading(true);
    API.getUsers(new URLSearchParams({ inc: 'gender,name,email', results: '5' })).then(populateData);
  }, [])


  const populateData = (apiResponse: ApiRandomGetResponse | FetchError) => {
    if (apiResponse.success) {
      let apiResults = (apiResponse as ApiRandomGetResponse).results;
      let dataFormatted = formatUserData(apiResults);
      setUsers(dataFormatted);
    } else {
      alert('there is a fetch problem with your data');
    }
    setLoading(false);
  }


  //Helper functions
  const formatUserData = (users: ApiUserStructure[]) => {
    let auxUsers: User[] = [];
    users.map((each, key) => auxUsers.push({ key: key.toString(), email: each.email, gender: each.gender, fullname: each.name.first + ' ' + each.name.last }))
    return auxUsers;
  }

  const getTextDownload = (cantItems: number) => {
    let userLabel = selectedRowKeys.length == 1 ? 'user' : 'users';
    return `Export ${selectedRowKeys.length ? selectedRowKeys.length : 'all '} ${userLabel}`;
  }

  const prepareSelectedUsersArray = (selectedIndexes: React.Key[]) => {
    let usersFiltered: User[] = [];
    selectedIndexes.forEach((selectedKey) => {
      const filteredUsers = users.filter((user) => user.key === selectedKey);
      if (filteredUsers.length > 0) usersFiltered.push(filteredUsers[0]);
    });

    return usersFiltered;
  }

  const getTextValByColName = (colName: UserIndexName) => {
    let result: TxtVal[] = [];
    users.map(each => result.push({ text: each[colName], value: each[colName] }));
    return result;
  }

  //Table methods
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setUsersSelected(prepareSelectedUsersArray(newSelectedRowKeys));
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  const hasSelected = selectedRowKeys.length > 0;

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setUsers((previous) => {
        const activeIndex = previous.findIndex((i) => i.key === active.id);
        const overIndex = previous.findIndex((i) => i.key === over?.id);
        return arrayMove(previous, activeIndex, overIndex);
      });
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'sort'
    },
    {
      title: 'Full Name',
      dataIndex: 'fullname',
      sorter: (a, b) => a.fullname.length - b.fullname.length,
      onFilter: (value: any, user) => user.fullname.indexOf(value) === 0,
      filters: getTextValByColName(UserIndexName.FullName),
      filterSearch: true,
      sortDirections: ['descend'],
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      filters: getTextValByColName(UserIndexName.Gender),
      onFilter: (value: any, user) => user.gender.indexOf(value) === 0,
      filterSearch: true,
      sorter: (a, b) => a.gender.length - b.gender.length,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      sorter: (a, b) => a.email.length - b.email.length,
      filters: getTextValByColName(UserIndexName.Email),
      onFilter: (value: any, user) => user.email.indexOf(value) === 0,
      filterSearch: true,
      sortDirections: ['descend'],
    },
  ];

  return (
    <div className='App'>
      <Row>
        <Col offset={16} md={8}>
          <Row>
            <Col md={12}>
              <ExportButton
                textButton={getTextDownload(selectedRowKeys.length)}
                userList={usersSelected.length ? usersSelected : users}
              />
            </Col>
            <Col md={12}>
              <Button type="primary" onClick={getUserData} loading={loading}>
                Load users
              </Button>
            </Col>
          </Row>
        </Col>

        <Col md={24}>
          <DndContext onDragEnd={onDragEnd}>
            <SortableContext
              items={users.map((i) => i.key)}
              strategy={verticalListSortingStrategy}
            >
              <Table
                components={{ body: { row: RowDrag } }}
                rowKey="key"
                rowSelection={rowSelection}
                columns={columns}
                dataSource={users}
                loading={loading}
              />
            </SortableContext>
          </DndContext>
        </Col>
      </Row>
    </div>
  );
};

export default App;