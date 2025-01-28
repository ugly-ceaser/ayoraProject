import React, { useState } from 'react';
import Avatar from 'react-avatar';
import Select from 'react-select';

type TagInputProps = {
    suggestions: string[];
    defaultValues?: { label: string, value: string }[];
    placeholder: string;
    label: string;

    onChange: (values: { label: string, value: string }[]) => void;
    value: { label: string, value: string }[];
};

const TagInput: React.FC<TagInputProps> = ({ suggestions, defaultValues = [], label, onChange, value }) => {
    const [input, setInput] = useState('');

    const options = suggestions.map(suggestion => ({
        label: (
            <span className='flex items-center gap-2'>
                <Avatar name={suggestion} size='25' textSizeRatio={2} round={true} />
                {suggestion}
            </span>
        ), value: suggestion
    }));

    return <div className="border rounded-md flex items-center">
        <span className='ml-3 text-sm text-gray-500'>{label}</span>
        <Select
            value={value}
            // @ts-ignore
            onChange={onChange}
            className='w-full flex-1 '
            isMulti
            onInputChange={setInput}
            defaultValue={defaultValues}
            placeholder={''}
            options={input ? options.concat({
                label: (
                    <span className='flex items-center gap-2'>
                        <Avatar name={input} size='25' textSizeRatio={2} round={true} />
                        {input}
                    </span>
                ), value: input
            }) : options as any}
            classNames={{
                control: () => {
                    return '!border-none !outline-none dark:text-white !ring-0 !shadow-none focus:border-none focus:outline-none focus:ring-0 focus:shadow-none dark:bg-transparent'
                },
                input: () => {
                    return 'dark:text-gray-300'
                },
                menu: () => {
                    return 'dark:bg-gray-700'
                },
                option: () => {
                    return 'dark:bg-gray-700'
                },
                multiValue: () => {
                    return 'dark:bg-muted'
                },
                multiValueLabel: () => {
                    return 'dark:text-white dark:bg-muted rounded-md'
                }
            }}
            classNamePrefix="select"
        />
    </div>
};

export default TagInput;
