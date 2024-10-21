'use client'

import { useState, useEffect } from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/Table";

// Define the data type based on the JSON structure
interface Dataset {
    category: string;
    name: string;
    description: string;
    source: string;
    gee_asset: string;
}

export default function DatasetTablePage() {
    // Your data here, replace this with your actual JSON data
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('/datasets.json');
            const jsonData = await response.json();
            setData(jsonData);
        };

        fetchData();
    }, []);

    const columns: ColumnDef<Dataset>[] = [
        {
            accessorKey: "name",
            header: "Dataset Name",
            size: 200,
            enableResizing: true, // Enable resizing for this column
        },
        {
            accessorKey: "category",
            header: "Category",
            size: 250,
            enableResizing: true, // Enable resizing for this column
        },
        {
            accessorKey: "description",
            header: "Description",
            size: 300,
            enableResizing: true, // Enable resizing for this column
        },
        {
            accessorKey: "source",
            header: "Source",
            size: 400,
            enableResizing: true, // Enable resizing for this column
        },
        {
            accessorKey: "gee_asset",
            header: "GEE Asset",
            size: 300,
            enableResizing: true, // Enable resizing for this column
        },
    ];

    const table = useReactTable({
        data,
        columns,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
        getCoreRowModel: getCoreRowModel(),
        debugTable: true,
        debugHeaders: true,
        debugColumns: true,
    })

    return (

        <div className="min-h-screen text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Whisp Datasets</h1>
                <div className="bg-gray-800 p-4 text-white rounded-lg shadow-lg">
                    <div className="p-4 overflow-x-auto">
                        <Table className="min-w-full text-sm divide-y" style={{ tableLayout: 'fixed' }}>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                                                style={{ width: header.column.getSize() }}
                                            >
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className="px-6 py-4 whitespace-nowrap"
                                                style={{
                                                    width: cell.column.getSize(),
                                                    maxWidth: cell.column.getSize(),
                                                    position: "relative",
                                                }}
                                            >
                                                {/* Cell content with ellipsis */}
                                                <div
                                                    className="truncate"
                                                    style={{
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        maxWidth: "100%",
                                                    }}
                                                    title={cell.getValue() as string} // Tooltip on hover with full text
                                                >
                                                    {cell.getValue() as string}
                                                </div>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>

    );
}
