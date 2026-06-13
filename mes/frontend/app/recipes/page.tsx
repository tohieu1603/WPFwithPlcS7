"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Table, Button, Modal, Form, InputNumber, Input, Space, Popconfirm, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getRecipes, createRecipe, updateRecipe, deleteRecipe } from "@/lib/api";
import type { Recipe } from "@/lib/types";

export default function RecipesPage() {
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [msg, ctx] = message.useMessage();

  const { data, isFetching } = useQuery({ queryKey: ["recipes"], queryFn: getRecipes });

  const save = useMutation({
    mutationFn: (v: Partial<Recipe>) => (editing ? updateRecipe(editing.id, v) : createRecipe(v)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      setOpen(false);
      msg.success("Recipe saved");
    },
    onError: (e: any) => msg.error(e?.response?.data?.error ?? "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: number) => deleteRecipe(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      msg.success("Recipe deleted");
    },
  });

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }
  function openEdit(r: Recipe) {
    setEditing(r);
    form.setFieldsValue(r);
    setOpen(true);
  }

  const columns = [
    { title: "No.", dataIndex: "number", key: "number", width: 70 },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Gap nom", dataIndex: "gapNominal", key: "gapNominal" },
    { title: "Gap tol", dataIndex: "gapTol", key: "gapTol" },
    { title: "Min score", dataIndex: "visionMinScore", key: "visionMinScore" },
    { title: "Press (N)", dataIndex: "pressForce", key: "pressForce" },
    { title: "Torque", dataIndex: "screwTorque", key: "screwTorque" },
    { title: "Min grade", dataIndex: "barcodeMinGrade", key: "barcodeMinGrade" },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, r: Recipe) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Delete this recipe?" onConfirm={() => del.mutate(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const numberFields: [keyof Recipe, string][] = [
    ["gapNominal", "Gap nominal (mm)"],
    ["gapTol", "Gap tolerance (mm)"],
    ["visionMinScore", "Vision min score (%)"],
    ["pressForce", "Press force (N)"],
    ["screwTorque", "Screw torque (Nm)"],
    ["cycleTarget", "Cycle target (s)"],
    ["barcodeMinGrade", "Barcode min grade"],
  ];

  return (
    <Card
      title="Recipes"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          New recipe
        </Button>
      }
    >
      {ctx}
      <Table rowKey="id" size="small" loading={isFetching} columns={columns} dataSource={data ?? []} pagination={false} />

      <Modal
        open={open}
        title={editing ? `Edit recipe ${editing.name}` : "New recipe"}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          <Form.Item name="number" label="Recipe number" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} disabled={!!editing} />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {numberFields.map(([k, label]) => (
            <Form.Item key={k} name={k} label={label}>
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </Card>
  );
}
