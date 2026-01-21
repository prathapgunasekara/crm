import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataProvider, useNotify } from "ra-core";

const schemas = {
    contacts: [
        'first_name', 'last_name', 'title', 'company_id', 'email', 'linkedin_url', 'status', 'background', 'phone'
    ],
    companies: [
        'name', 'sector', 'size', 'linkedin_url', 'website', 'phone_number', 'address', 'zipcode', 'city', 'country'
    ],
};

export const DataImportWizard = () => {
    const [data, setData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [resource, setResource] = useState<keyof typeof schemas>('contacts');
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const dataProvider = useDataProvider();
    const notify = useNotify();

    const handleMappingChange = (source: string, target: string) => {
        setMapping(prev => ({ ...prev, [source]: target }));
    };

    const handleImport = async () => {
        const transformedData = data.map(row => {
            const newRow: Record<string, any> = {};
            for (const key in mapping) {
                if (mapping[key]) {
                    newRow[mapping[key]] = row[key];
                }
            }
            return newRow;
        });

        try {
            await Promise.all(transformedData.map(item => dataProvider.create(resource, { data: item })));
            notify(`${transformedData.length} records imported successfully.`, { type: 'success' });
            setData([]);
            setHeaders([]);
            setMapping({});
        } catch (e) {
            notify('Error importing data. Please check the console for details.', { type: 'error' });
            console.error(e);
        }
    };

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setData(results.data);
                    const fileHeaders = results.meta.fields || [];
                    setHeaders(fileHeaders);

                    // Auto-map headers
                    const initialMapping: Record<string, string> = {};
                    fileHeaders.forEach(header => {
                        if (schemas[resource].includes(header)) {
                            initialMapping[header] = header;
                        }
                    });
                    setMapping(initialMapping);
                    setError(null);
                },
                error: (err) => {
                    setError(err.message);
                },
            });
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] } });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Data Import Wizard</CardTitle>
            </CardHeader>
            <CardContent>
                <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer">
                    <input {...getInputProps()} />
                    {isDragActive ? (
                        <p>Drop the files here ...</p>
                    ) : (
                        <p>Drag 'n' drop a CSV file here, or click to select a file</p>
                    )}
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                {data.length > 0 && (
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold">Map Fields</h3>
                        <div className="my-4">
                            <label htmlFor="resource-select" className="block text-sm font-medium text-gray-700 mb-2">Select Resource to Import</label>
                            <Select onValueChange={(value: keyof typeof schemas) => setResource(value)} defaultValue={resource}>
                                <SelectTrigger id="resource-select">
                                    <SelectValue placeholder="Select a resource" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="contacts">Contacts</SelectItem>
                                    <SelectItem value="companies">Companies</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="font-semibold">CSV Header</div>
                            <div className="font-semibold">Map to Field</div>
                            {headers.map(header => (
                                <>
                                    <div>{header}</div>
                                    <div>
                                        <Select onValueChange={(value) => handleMappingChange(header, value)} value={mapping[header] || ''}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a field" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">-- Do not import --</SelectItem>
                                                {schemas[resource].map(field => (
                                                    <SelectItem key={field} value={field}>{field}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            ))}
                        </div>

                        <Button
                            onClick={handleImport}
                            className="mt-4"
                            disabled={Object.keys(mapping).length === 0}
                        >
                            Import Data
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
