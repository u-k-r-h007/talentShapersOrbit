import * as React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

const Table: React.FC<TableProps> = ({ headers, children }) => {
  return (
    <div className="card shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover mb-0">
            <thead>
                <tr>
                    {headers.map((header, index) => (
                        <th key={index} scope="col" className="p-3">
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;